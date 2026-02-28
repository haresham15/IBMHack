'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const OSU_LNG = -83.0099, OSU_LAT = 40.0072
const DEFAULT_ZOOM = 16, DEFAULT_PITCH = 45, DEFAULT_BEARING = -17

const ROUTE_SOURCE = 'osu-route'
const ROUTE_GLOW = 'osu-route-glow'
const ROUTE_LINE = 'osu-route-line'
const ROUTE_ARROWS = 'osu-route-arrows'

// ── Source-type → route colour ─────────────────────────────────────────────
function colorByType(type) {
  if (type === 'dorm' || type === 'athletics' || type === 'campus-life') return '#00E676'
  if (type === 'academic' || type === 'library') return '#0070FF'
  return '#bb0000'
}

// ── Haversine metres ───────────────────────────────────────────────────────
function haversineM([lng1, lat1], [lng2, lat2]) {
  const R = 6371000, r = Math.PI / 180
  const dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Directions API (steps=true for intersection waypoints) ─────────────────
async function fetchWalkingRoute(token, oLng, oLat, dLng, dLat) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${oLng},${oLat};${dLng},${dLat}?geometries=geojson&overview=full&steps=true&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Directions API error')
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('No routes returned')
  const steps = (route.legs?.[0]?.steps ?? []).map((s, idx) => ({
    idx,
    lng: s.maneuver.location[0],
    lat: s.maneuver.location[1],
    instruction: s.maneuver.instruction ?? '',
    type: s.maneuver.type ?? 'turn',
    modifier: s.maneuver.modifier ?? '',
    name: s.name ?? '',
    distanceM: s.distance ?? 0,
  }))
  return { geometry: route.geometry, durationSec: route.duration, distanceM: route.distance, steps }
}

function fmtDur(sec) { const m = Math.ceil(sec / 60); return m === 1 ? '1 min' : `${m} mins` }
function fmtDist(m) {
  if (m < 300) return `${Math.round(m)} m`
  const mi = m / 1609.34
  return mi < 1 ? `${(mi * 5280).toFixed(0)} ft` : `${mi.toFixed(2)} mi`
}

// ── line-gradient expression ───────────────────────────────────────────────
function buildGradient(color, focus) {
  if (!focus) return ['interpolate', ['linear'], ['line-progress'], 0, color + 'AA', 1, color]
  // Focus mode: full-brightness white gradient — white is unaffected by
  // CSS grayscale filter, so the route appears at maximum luminance on the
  // dark fog map ("full capacity").
  return ['interpolate', ['linear'], ['line-progress'],
    0, 'rgba(255,255,255,0.55)',
    0.25, '#FFFFFF',
    1, '#FFFFFF']
}

// ── Landmark anchor popup ──────────────────────────────────────────────────
function landmarkHTML(lm) {
  return `<div style="font-family:'IBM Plex Sans',sans-serif;padding:12px 14px;max-width:230px;line-height:1.4">
    <div style="font-size:28px;text-align:center;margin-bottom:6px">${lm.emoji}</div>
    <div style="font-weight:700;font-size:13px;color:#0050CC;margin-bottom:2px">${lm.name}</div>
    <div style="font-size:11px;color:#525252;margin-bottom:8px;font-style:italic">${lm.subtitle}</div>
    <hr style="border:none;border-top:1px solid #E0E0E0;margin:8px 0"/>
    <div style="font-size:12px;font-weight:600;color:#161616;margin-bottom:5px">${lm.sensoryNote}</div>
    <div style="font-size:11px;color:#0070FF;font-weight:500">↗ ${lm.wayfinding}</div>
  </div>`
}

export default function CampusMap({
  destination = null,
  onDestinationClear,
  onWaypointsReady,   // (steps[], totalDistM) → void
  onCheckpointHit,    // (idx) → void
  onPosUpdate,        // (lng, lat, remainingM) → void
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const geoCtrlRef = useRef(null)
  const userPosRef = useRef(null)
  const focusModeRef = useRef(false)
  const destFeatRef = useRef(null)
  const srcFeatRef = useRef(null)
  const anchorMarkersRef = useRef([])
  const landmarksRef = useRef([])
  const waypointsRef = useRef([])
  const firedRef = useRef(new Set())
  const pulseIntervalRef = useRef(null)
  const intersectionPopRef = useRef(null)

  const [eta, setEta] = useState(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [anchorCount, setAnchorCount] = useState(0)

  const routeColor = destination
    ? colorByType(destination.type)
    : '#bb0000'

  // ── Load landmarks ────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/landmarks.json').then(r => r.json()).then(d => { landmarksRef.current = d }).catch(() => { })
  }, [])

  // ── Query 3d-buildings feature near a point ────────────────────────────
  const queryBuildingAt = useCallback((lng, lat) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return null
    const px = map.project([lng, lat])
    const feats = map.queryRenderedFeatures(
      [[px.x - 35, px.y - 35], [px.x + 35, px.y + 35]],
      { layers: ['3d-buildings'] }
    )
    return feats[0] ?? null
  }, [])

  // ── Dual fog-of-war: source + dest at 1.0, all others 0.15 ─────────────
  // Uses ['case', feature-state isDestination / isSource, 1.0, 0.15]
  const applyFogOfWar = useCallback((enabled, destLng, destLat, srcLng, srcLat) => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    const clearFS = (ref) => {
      if (ref.current) {
        try { map.removeFeatureState(ref.current) } catch (_) { }
        ref.current = null
      }
    }

    if (enabled && destLng != null) {
      clearFS(destFeatRef); clearFS(srcFeatRef)

      // ── Destination building ──
      const destFeat = queryBuildingAt(destLng, destLat)
      if (destFeat) {
        destFeatRef.current = { source: 'composite', sourceLayer: 'building', id: destFeat.id }
        map.setFeatureState(destFeatRef.current, { isDestination: true, isSource: false })
      }

      // ── Source building (user's starting point) ──
      if (srcLng != null) {
        const srcFeat = queryBuildingAt(srcLng, srcLat)
        if (srcFeat && srcFeat.id !== destFeat?.id) {
          srcFeatRef.current = { source: 'composite', sourceLayer: 'building', id: srcFeat.id }
          map.setFeatureState(srcFeatRef.current, { isSource: true, isDestination: false })
        }
      }

      // Opacity expression: dest=1.0, source=0.95, others=0.15
      map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', [
        'case',
        ['boolean', ['feature-state', 'isDestination'], false], 1.0,
        ['boolean', ['feature-state', 'isSource'], false], 0.95,
        0.15
      ])
      // Color expression: dest=OSU Scarlet, source=routeColor, others=natural brick grey
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
        'case',
        ['boolean', ['feature-state', 'isDestination'], false], '#bb0000',
        ['boolean', ['feature-state', 'isSource'], false], routeColor,
        '#c8c8cc'
      ])
    } else {
      clearFS(destFeatRef); clearFS(srcFeatRef)
      map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', isFocusMode ? [
        'case',
        ['boolean', ['feature-state', 'isDestination'], false], 1.0,
        ['boolean', ['feature-state', 'isSource'], false], 0.95,
        0.15
      ] : 0.72)
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', '#d4d4d8')
    }
  }, [queryBuildingAt, routeColor, isFocusMode])

  // ── Pulsing glow animation ─────────────────────────────────────────────
  const startPulse = useCallback(() => {
    if (pulseIntervalRef.current) return
    let t = 0
    pulseIntervalRef.current = setInterval(() => {
      if (!mapRef.current?.getLayer(ROUTE_GLOW)) { stopPulse(); return }
      t += 0.12
      const w = 18 + 8 * Math.sin(t)
      const o = 0.2 + 0.15 * Math.sin(t + 1)
      mapRef.current.setPaintProperty(ROUTE_GLOW, 'line-width', w)
      mapRef.current.setPaintProperty(ROUTE_GLOW, 'line-opacity', o)
    }, 80)
  }, [])

  const stopPulse = useCallback(() => {
    if (pulseIntervalRef.current) { clearInterval(pulseIntervalRef.current); pulseIntervalRef.current = null }
  }, [])

  // ── Landmark anchors ──────────────────────────────────────────────────
  const clearLandmarks = useCallback(() => {
    anchorMarkersRef.current.forEach(m => m.remove())
    anchorMarkersRef.current = []
    setAnchorCount(0)
  }, [])

  const showLandmarks = useCallback((destLng, destLat) => {
    const map = mapRef.current
    if (!map || !landmarksRef.current.length) return
    clearLandmarks()
    const nearby = landmarksRef.current.filter(lm =>
      haversineM([lm.coordinates[0], lm.coordinates[1]], [destLng, destLat]) < 1500
    )
    nearby.forEach(lm => {
      const el = document.createElement('div')
      el.innerHTML = `<div style="background:linear-gradient(135deg,#0050CC,#0070FF);color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;box-shadow:0 0 0 4px rgba(0,112,255,.3),0 2px 8px rgba(0,0,0,.25);border:2px solid #fff">${lm.emoji}</div>`
      const popup = new mapboxgl.Popup({ offset: 20, maxWidth: '260px', className: 'landmark-popup' }).setHTML(landmarkHTML(lm))
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(lm.coordinates).setPopup(popup).addTo(map)
      anchorMarkersRef.current.push(marker)
    })
    setAnchorCount(nearby.length)
  }, [clearLandmarks])

  // ── Intersection proximity check ───────────────────────────────────────
  // Fires onCheckpointHit(idx) within 15m of each waypoint (in Focus Mode only)
  // Also triggers intersection popup for all-time use
  const checkIntersectionProximity = useCallback((userLng, userLat) => {
    const map = mapRef.current
    if (!map || waypointsRef.current.length === 0) return

    waypointsRef.current.forEach((wp, idx) => {
      if (firedRef.current.has(idx)) return
      const dist = haversineM([userLng, userLat], [wp.lng, wp.lat])
      if (dist <= 15) {
        firedRef.current.add(idx)
        onCheckpointHit?.(idx)

        // Intersection popup (always, not just focus mode)
        if (wp.type !== 'depart') {
          intersectionPopRef.current?.remove()
          const popup = new mapboxgl.Popup({
            closeOnClick: true, closeButton: true,
            maxWidth: '260px', className: 'intersection-popup', offset: 20
          })
            .setLngLat([wp.lng, wp.lat])
            .setHTML(`<div style="font-family:'IBM Plex Sans',sans-serif;padding:12px 14px">
            <div style="font-size:20px;margin-bottom:6px">📍</div>
            <div style="font-weight:700;font-size:13px;color:#161616;margin-bottom:4px">Checkpoint reached!</div>
            <div style="font-size:12px;color:#525252;line-height:1.5">${wp.instruction}</div>
            ${wp.name ? `<div style="margin-top:6px;font-size:11px;color:#525252;font-style:italic">at ${wp.name}</div>` : ''}
          </div>`)
            .addTo(map)
          intersectionPopRef.current = popup
        }
      }
    })
  }, [onCheckpointHit])

  // ── Draw / update route layers ─────────────────────────────────────────
  const drawRoute = useCallback((geometry, color, focus) => {
    const map = mapRef.current
    if (!map) return
    const geojson = { type: 'Feature', properties: {}, geometry }
    const gradient = buildGradient(color, focus)
    const lineW = focus ? 9 : 5
    const arrowSz = focus ? 24 : 16

    const firstLabel = map.getStyle().layers.find(
      l => l.type === 'symbol' && l.layout?.['text-field']
    )?.id

    if (map.getSource(ROUTE_SOURCE)) {
      map.getSource(ROUTE_SOURCE).setData(geojson)
      map.setPaintProperty(ROUTE_LINE, 'line-gradient', gradient)
      map.setPaintProperty(ROUTE_LINE, 'line-width', lineW)
      map.setPaintProperty(ROUTE_ARROWS, 'text-color', focus ? '#FFFFFF' : color)
      map.setLayoutProperty(ROUTE_ARROWS, 'text-size', arrowSz)
    } else {
      map.addSource(ROUTE_SOURCE, { type: 'geojson', lineMetrics: true, data: geojson })

      // Wide pulsing glow — controlled by pulse interval
      map.addLayer({
        id: ROUTE_GLOW, type: 'line', source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-gradient': gradient, 'line-width': 18, 'line-opacity': 0.22, 'line-blur': 7 }
      }, firstLabel)

      // Solid route line — always 1.0 opacity, exempt from fog
      map.addLayer({
        id: ROUTE_LINE, type: 'line', source: ROUTE_SOURCE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-gradient': gradient, 'line-width': lineW, 'line-opacity': 1.0 }
      }, firstLabel)

      // Oversized AR directional arrows along route
      map.addLayer({
        id: ROUTE_ARROWS, type: 'symbol', source: ROUTE_SOURCE,
        layout: {
          'symbol-placement': 'line', 'symbol-spacing': 65,
          'text-field': '▶',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': arrowSz,
          'text-allow-overlap': true, 'text-ignore-placement': true,
          'text-keep-upright': false,
          'text-rotation-alignment': 'map', 'text-pitch-alignment': 'map',
        },
        paint: {
          'text-color': focus ? '#FFFFFF' : color,
          'text-opacity': 0.95,
          'text-halo-color': focus ? 'rgba(0,60,180,.8)' : 'rgba(0,0,0,.35)',
          'text-halo-width': focus ? 2.5 : 1.5,
        }
      })
    }
    startPulse()
  }, [startPulse])

  // ── Clear route layers ─────────────────────────────────────────────────
  const clearRoute = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    stopPulse()
      ;[ROUTE_ARROWS, ROUTE_LINE, ROUTE_GLOW].forEach(id => {
        if (map.getLayer(id)) map.removeLayer(id)
      })
    if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE)
    intersectionPopRef.current?.remove()
    waypointsRef.current = []
    firedRef.current.clear()
    setEta(null)
  }, [stopPulse])

  // ── Initialise map ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [OSU_LNG, OSU_LAT], zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH, bearing: DEFAULT_BEARING, antialias: true
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    const geoCtrl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true, showUserHeading: true
    })
    map.addControl(geoCtrl, 'top-right')
    geoCtrlRef.current = geoCtrl

    geoCtrl.on('geolocate', e => {
      const { longitude: lng, latitude: lat } = e.coords
      userPosRef.current = { lng, lat }
      setGeoError(null)
      checkIntersectionProximity(lng, lat)
      const remainM = destination ? haversineM([lng, lat], [destination.lng, destination.lat]) : 0
      onPosUpdate?.(lng, lat, remainM)
    })
    geoCtrl.on('error', () => setGeoError('Location access denied. Enable GPS to use navigation.'))

    new mapboxgl.Marker({ color: '#bb0000' })
      .setLngLat([OSU_LNG, OSU_LAT])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('The Ohio State University'))
      .addTo(map)

    map.on('load', () => {
      const firstLabel = map.getStyle().layers.find(
        l => l.type === 'symbol' && l.layout?.['text-field']
      )?.id
      // 3D buildings layer using feature-state for dual fog expression
      map.addLayer({
        id: '3d-buildings', source: 'composite', 'source-layer': 'building',
        filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 15,
        paint: {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'isDestination'], false], '#bb0000',
            ['boolean', ['feature-state', 'isSource'], false], '#00AA55',
            '#d4d4d8'
          ],
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'height']],
          'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.05, ['get', 'min_height']],
          'fill-extrusion-opacity': 0.72
        }
      }, firstLabel)
    })

    return () => { stopPulse(); map.remove(); mapRef.current = null }
  }, [checkIntersectionProximity, onPosUpdate, stopPulse, destination])

  // ── React to isFocusMode ───────────────────────────────────────────────
  useEffect(() => {
    focusModeRef.current = isFocusMode
    const map = mapRef.current
    if (!isFocusMode) {
      clearLandmarks()
      firedRef.current.clear()
      applyFogOfWar(false)
      if (map?.getLayer(ROUTE_LINE)) {
        const g = buildGradient(routeColor, false)
        map.setPaintProperty(ROUTE_LINE, 'line-gradient', g)
        map.setPaintProperty(ROUTE_LINE, 'line-width', 5)
        map.setPaintProperty(ROUTE_ARROWS, 'text-color', routeColor)
        map.setLayoutProperty(ROUTE_ARROWS, 'text-size', 16)
      }
    } else {
      if (destination) {
        applyFogOfWar(true, destination.lng, destination.lat, userPosRef.current?.lng, userPosRef.current?.lat)
        showLandmarks(destination.lng, destination.lat)
      }
      if (map?.getLayer(ROUTE_LINE)) {
        const g = buildGradient(routeColor, true)
        map.setPaintProperty(ROUTE_LINE, 'line-gradient', g)
        map.setPaintProperty(ROUTE_LINE, 'line-width', 9)
        map.setPaintProperty(ROUTE_ARROWS, 'text-color', '#FFFFFF')
        map.setLayoutProperty(ROUTE_ARROWS, 'text-size', 24)
      }
    }
  }, [isFocusMode, destination, routeColor, applyFogOfWar, showLandmarks, clearLandmarks])

  // ── React to destination prop ──────────────────────────────────────────
  useEffect(() => {
    if (!destination) {
      clearRoute(); clearLandmarks(); applyFogOfWar(false); return
    }
    const map = mapRef.current
    if (!map) return
    const color = routeColor

    const go = async (oLng, oLat) => {
      setRouteLoading(true)
      try {
        const { geometry, durationSec, distanceM, steps } = await fetchWalkingRoute(
          process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN, oLng, oLat, destination.lng, destination.lat
        )
        waypointsRef.current = steps
        firedRef.current.clear()
        onWaypointsReady?.(steps, distanceM)

        drawRoute(geometry, color, focusModeRef.current)
        setEta({ duration: fmtDur(durationSec), distance: fmtDist(distanceM), name: destination.name, color })

        const bounds = new mapboxgl.LngLatBounds()
        bounds.extend([oLng, oLat]); bounds.extend([destination.lng, destination.lat])
        map.fitBounds(bounds, { padding: 90, pitch: 55, duration: 1500 })

        map.once('idle', () => {
          if (focusModeRef.current) {
            applyFogOfWar(true, destination.lng, destination.lat, oLng, oLat)
            showLandmarks(destination.lng, destination.lat)
          }
        })
      } catch (err) { console.error('Route fetch failed:', err) }
      finally { setRouteLoading(false) }
    }

    if (userPosRef.current) {
      go(userPosRef.current.lng, userPosRef.current.lat)
    } else {
      map.flyTo({ center: [destination.lng, destination.lat], zoom: 17, pitch: 55, duration: 1400 })
      let geoReceived = false
      const onGeo = e => {
        geoReceived = true
        userPosRef.current = { lng: e.coords.longitude, lat: e.coords.latitude }
        go(e.coords.longitude, e.coords.latitude)
        geoCtrlRef.current?.off('geolocate', onGeo)
      }
      geoCtrlRef.current?.on('geolocate', onGeo)
      setTimeout(() => geoCtrlRef.current?.trigger(), 200)
      // Fallback: if GPS not received within 4s, route from OSU campus centre
      // so the path is always visible even without location permission.
      setTimeout(() => {
        if (!geoReceived && !userPosRef.current) {
          geoCtrlRef.current?.off('geolocate', onGeo)
          go(OSU_LNG, OSU_LAT)
        }
      }, 4000)
    }
  }, [destination, drawRoute, clearRoute, clearLandmarks, applyFogOfWar, showLandmarks, onWaypointsReady, routeColor])

  const handleFindMe = () => { setGeoError(null); geoCtrlRef.current?.trigger() }
  const handleClearEta = () => { clearRoute(); clearLandmarks(); applyFogOfWar(false); onDestinationClear?.() }

  return (
    <>
      <style>{`
        .landmark-popup    .mapboxgl-popup-content,
        .intersection-popup .mapboxgl-popup-content {
          padding:0; border-radius:12px; overflow:hidden;
          box-shadow:0 8px 24px rgba(0,80,200,.2);
        }
        .intersection-popup .mapboxgl-popup-content { box-shadow:0 8px 24px rgba(180,0,0,.25); }
        .landmark-popup .mapboxgl-popup-close-button,
        .intersection-popup .mapboxgl-popup-close-button { font-size:18px;padding:4px 8px;color:#525252; }
        @keyframes spin { to{transform:rotate(360deg);} }
        @keyframes focusPulse { 0%,100%{opacity:1;}50%{opacity:.7;} }

        /* ── Focus Mode: desaturate ONLY the WebGL canvas, not DOM siblings ─── */
        /* The user-location dot / accuracy-circle are sibling divs next to the  */
        /* canvas inside .mapboxgl-canvas-container — they are NOT inside canvas, */
        /* so this filter does NOT affect them.                                   */
        .mapbox-focus-mode canvas.mapboxgl-canvas {
          filter: grayscale(78%) brightness(0.6) contrast(1.05);
          transition: filter 700ms ease;
        }

        /* Ensure user location elements are always at FULL brightness/color,    */
        /* even when a parent div might carry a stacking-context filter.          */
        .mapboxgl-user-location-dot,
        .mapboxgl-user-location-accuracy-circle,
        .mapboxgl-user-location-heading {
          filter: none !important;
          opacity: 1 !important;
        }

        /* Extra pulse ring in Focus Mode — makes the dot unmissable */
        .mapbox-focus-mode .mapboxgl-user-location-dot {
          box-shadow: 0 0 0 4px rgba(30,144,255,0.55),
                      0 0 0 8px rgba(30,144,255,0.25) !important;
        }

        /* Ensure Mapbox accuracy circle stays visible */
        .mapbox-focus-mode .mapboxgl-user-location-accuracy-circle {
          border-color: rgba(30,144,255,0.5) !important;
        }
      `}</style>

      <div style={{ position: 'relative', width: '100%', height: '100%' }}>

        {/* Map canvas — grayscale applied via CSS class (targets canvas only, */}
        {/* NOT the user-location-dot which is a sibling of the canvas element) */}
        <div
          ref={containerRef}
          className={isFocusMode ? 'mapbox-focus-mode' : undefined}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Focus Mode active banner */}
        {isFocusMode && (
          <div style={{
            position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, background: 'linear-gradient(90deg,#003A9E,#0070FF)',
            color: '#fff', borderRadius: '20px', padding: '7px 20px',
            fontSize: '12px', fontWeight: '700',
            boxShadow: '0 2px 20px rgba(0,112,255,.55)',
            fontFamily: 'IBM Plex Sans,sans-serif', letterSpacing: '.04em',
            display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
            animation: 'focusPulse 3s ease-in-out infinite'
          }}>
            🧠 Focus Mode — Fog of War · Dual Building Highlight
            {anchorCount > 0 && (
              <span style={{ backgroundColor: 'rgba(255,255,255,.2)', borderRadius: '10px', padding: '1px 8px', fontSize: '11px' }}>
                {anchorCount} anchors
              </span>
            )}
          </div>
        )}

        {/* Focus Mode toggle */}
        <button onClick={() => setIsFocusMode(f => !f)}
          style={{
            position: 'absolute', bottom: '164px', right: '10px', zIndex: 10,
            backgroundColor: isFocusMode ? '#0070FF' : '#FFFFFF',
            border: `2px solid ${isFocusMode ? '#0070FF' : '#6b7280'}`,
            borderRadius: '8px', padding: '8px 13px', fontSize: '12px', fontWeight: '700',
            color: isFocusMode ? '#fff' : '#374151', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: isFocusMode ? '0 0 0 3px rgba(0,112,255,.35),0 2px 12px rgba(0,112,255,.5)' : '0 2px 8px rgba(0,0,0,.18)',
            fontFamily: 'IBM Plex Sans,sans-serif', transition: 'all 220ms ease'
          }}>
          {isFocusMode ? '🧠 Focus ON' : '🧠 Focus Mode'}
        </button>

        {/* Find Me */}
        <button onClick={handleFindMe}
          style={{
            position: 'absolute', bottom: '120px', right: '10px', zIndex: 10,
            backgroundColor: '#FFFFFF', border: '2px solid #bb0000',
            borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '700',
            color: '#bb0000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,.18)', fontFamily: 'IBM Plex Sans,sans-serif', transition: 'all 150ms ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#bb0000'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#bb0000' }}
        >📍 Find Me</button>

        {/* Route loading */}
        {routeLoading && (
          <div style={{
            position: 'absolute', bottom: '16px', left: '16px', zIndex: 10,
            backgroundColor: 'rgba(255,255,255,.96)', borderRadius: '10px', padding: '12px 18px',
            boxShadow: '0 4px 16px rgba(0,0,0,.14)',
            display: 'flex', alignItems: 'center', gap: '10px',
            fontFamily: 'IBM Plex Sans,sans-serif', fontSize: '13px', color: '#161616'
          }}>
            <div style={{
              width: '16px', height: '16px', border: `2px solid ${routeColor}`,
              borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite'
            }} />
            Calculating route…
          </div>
        )}

        {/* ETA overlay */}
        {eta && !routeLoading && (
          <div style={{
            position: 'absolute', bottom: '16px', left: '16px', zIndex: 10,
            backgroundColor: 'rgba(255,255,255,.98)', borderRadius: '12px', padding: '14px 18px',
            boxShadow: isFocusMode
              ? `0 4px 28px ${eta.color}66,0 0 0 2px ${eta.color}33`
              : '0 4px 20px rgba(0,0,0,.16)',
            fontFamily: 'IBM Plex Sans,sans-serif', minWidth: '220px', maxWidth: '300px',
            borderLeft: `4px solid ${eta.color}`, transition: 'box-shadow 400ms ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: '11px', fontWeight: '700', color: eta.color,
                  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px',
                  display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  🚶 Walking Route
                  {isFocusMode && <span style={{
                    background: 'linear-gradient(90deg,#003A9E,#0070FF)', color: '#fff',
                    fontSize: '9px', fontWeight: '700', padding: '1px 7px', borderRadius: '10px'
                  }}>FOCUS</span>}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#161616', marginBottom: '8px', lineHeight: 1.3 }}>
                  {eta.name}
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#161616', lineHeight: 1 }}>{eta.duration}</div>
                    <div style={{ fontSize: '11px', color: '#525252', marginTop: '2px' }}>est. walk</div>
                  </div>
                  <div style={{ width: '1px', backgroundColor: '#E0E0E0' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: '#161616', lineHeight: 1 }}>{eta.distance}</div>
                    <div style={{ fontSize: '11px', color: '#525252', marginTop: '2px' }}>distance</div>
                  </div>
                </div>
              </div>
              <button onClick={handleClearEta}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '18px', color: '#525252', padding: '0 0 0 8px', lineHeight: 1, flexShrink: 0
                }}>✕</button>
            </div>
          </div>
        )}

        {/* Geo error */}
        {geoError && (
          <div style={{
            position: 'absolute', top: isFocusMode ? '52px' : '12px',
            left: '50%', transform: 'translateX(-50%)',
            zIndex: 10, backgroundColor: '#DA1E28', color: '#fff',
            borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,.2)',
            fontFamily: 'IBM Plex Sans,sans-serif',
            display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '90%'
          }}>
            ⚠️ {geoError}
            <button onClick={() => setGeoError(null)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', padding: 0 }}>✕</button>
          </div>
        )}
      </div>
    </>
  )
}
