'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// ── OSU campus centre ──────────────────────────────────────────────────────
const OSU_LNG = -83.0305
const OSU_LAT = 40.0067
const DEFAULT_ZOOM = 16
const DEFAULT_PITCH = 45
const DEFAULT_BEARING = -17

// ── Directions API ─────────────────────────────────────────────────────────
async function fetchWalkingRoute(token, originLng, originLat, destLng, destLat) {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/walking/` +
    `${originLng},${originLat};${destLng},${destLat}` +
    `?geometries=geojson&overview=full&access_token=${token}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Directions API error')
  const data = await res.json()
  const route = data.routes?.[0]
  if (!route) throw new Error('No routes returned')
  return {
    geometry: route.geometry,           // GeoJSON LineString
    durationSec: route.duration,        // seconds
    distanceM: route.distance           // metres
  }
}

// ── Format helpers ─────────────────────────────────────────────────────────
function fmtDuration(sec) {
  const m = Math.ceil(sec / 60)
  return m === 1 ? '1 min' : `${m} mins`
}
function fmtDistance(m) {
  if (m < 300) return `${Math.round(m)} m`
  const miles = m / 1609.34
  return miles < 1 ? `${(miles * 5280).toFixed(0)} ft` : `${miles.toFixed(2)} mi`
}

// ── Source / layer IDs ─────────────────────────────────────────────────────
const ROUTE_SOURCE = 'osu-route'
const ROUTE_LAYER = 'osu-route-line'

export default function CampusMap({ destination = null, onDestinationClear }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const geoCtrlRef = useRef(null)
  const userPosRef = useRef(null)   // { lng, lat } updated by geolocate events

  const [eta, setEta] = useState(null)          // { duration, distance, name }
  const [routeLoading, setRouteLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)

  // ── Helper: draw / update the route on the map ─────────────────────────
  const drawRoute = useCallback((geometry) => {
    const map = mapRef.current
    if (!map) return
    const geojson = { type: 'Feature', properties: {}, geometry }

    if (map.getSource(ROUTE_SOURCE)) {
      map.getSource(ROUTE_SOURCE).setData(geojson)
    } else {
      map.addSource(ROUTE_SOURCE, { type: 'geojson', data: geojson })
      // Insert route line below label layers so text stays readable
      const firstSymbol = map.getStyle().layers.find(
        l => l.type === 'symbol' && l.layout?.['text-field']
      )?.id
      map.addLayer(
        {
          id: ROUTE_LAYER,
          type: 'line',
          source: ROUTE_SOURCE,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#bb0000',
            'line-width': 5,
            'line-opacity': 0.88
          }
        },
        firstSymbol
      )
    }
  }, [])

  // ── Helper: remove route from map ──────────────────────────────────────
  const clearRoute = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    if (map.getLayer(ROUTE_LAYER)) map.removeLayer(ROUTE_LAYER)
    if (map.getSource(ROUTE_SOURCE)) map.removeSource(ROUTE_SOURCE)
    setEta(null)
  }, [])

  // ── Initialise map (once) ──────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [OSU_LNG, OSU_LAT],
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      antialias: true
    })

    mapRef.current = map

    // Navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    // GeolocateControl — added to map but we'll also keep a ref to trigger it
    const geoCtrl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    })
    map.addControl(geoCtrl, 'top-right')
    geoCtrlRef.current = geoCtrl

    // Track live user position for route origin
    geoCtrl.on('geolocate', (e) => {
      userPosRef.current = { lng: e.coords.longitude, lat: e.coords.latitude }
      setGeoError(null)
    })
    geoCtrl.on('error', () => {
      setGeoError('Location access denied. Enable GPS to use navigation.')
    })

    // Campus centre marker
    new mapboxgl.Marker({ color: '#bb0000' })
      .setLngLat([OSU_LNG, OSU_LAT])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('The Ohio State University'))
      .addTo(map)

    map.on('load', () => {
      // 3-D buildings
      const firstSymbol = map.getStyle().layers.find(
        l => l.type === 'symbol' && l.layout?.['text-field']
      )?.id

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 15,
          paint: {
            'fill-extrusion-color': '#d4d4d8',
            'fill-extrusion-height': [
              'interpolate', ['linear'], ['zoom'],
              15, 0, 15.05, ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate', ['linear'], ['zoom'],
              15, 0, 15.05, ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.72
          }
        },
        firstSymbol
      )
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── React to destination prop changes ──────────────────────────────────
  useEffect(() => {
    if (!destination) {
      clearRoute()
      return
    }

    const map = mapRef.current
    if (!map) return

    const fetchRoute = async (originLng, originLat) => {
      setRouteLoading(true)
      try {
        const { geometry, durationSec, distanceM } = await fetchWalkingRoute(
          process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN,
          originLng, originLat,
          destination.lng, destination.lat
        )
        drawRoute(geometry)
        setEta({
          duration: fmtDuration(durationSec),
          distance: fmtDistance(distanceM),
          name: destination.name
        })
        // Fly map to show both origin and destination
        const bounds = new mapboxgl.LngLatBounds()
        bounds.extend([originLng, originLat])
        bounds.extend([destination.lng, destination.lat])
        map.fitBounds(bounds, { padding: 80, pitch: 45, duration: 1200 })
      } catch (err) {
        console.error('Route fetch failed:', err)
      } finally {
        setRouteLoading(false)
      }
    }

    if (userPosRef.current) {
      fetchRoute(userPosRef.current.lng, userPosRef.current.lat)
    } else {
      // Fly to destination even without user location
      map.flyTo({ center: [destination.lng, destination.lat], zoom: 17, pitch: 50, duration: 1200 })
      // Show a pin and wait — route will be fetched when geolocate fires
      const waitForGeo = (e) => {
        const { longitude, latitude } = e.coords
        userPosRef.current = { lng: longitude, lat: latitude }
        fetchRoute(longitude, latitude)
        geoCtrlRef.current?.off('geolocate', waitForGeo)
      }
      geoCtrlRef.current?.on('geolocate', waitForGeo)
      // Trigger geolocation
      setTimeout(() => geoCtrlRef.current?.trigger(), 200)
    }
  }, [destination, drawRoute, clearRoute])

  // ── "Find Me" button handler ───────────────────────────────────────────
  const handleFindMe = () => {
    setGeoError(null)
    geoCtrlRef.current?.trigger()
  }

  // ── ETA overlay close ──────────────────────────────────────────────────
  const handleClearEta = () => {
    clearRoute()
    onDestinationClear?.()
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* ── "Find Me" button ───────────────────────────────────────────── */}
      <button
        onClick={handleFindMe}
        title="Find my location"
        style={{
          position: 'absolute',
          bottom: '120px',
          right: '10px',
          zIndex: 10,
          backgroundColor: '#FFFFFF',
          border: '2px solid #bb0000',
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '13px',
          fontWeight: '700',
          color: '#bb0000',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          transition: 'all 150ms ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#bb0000'
          e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#fff'
          e.currentTarget.style.color = '#bb0000'
        }}
      >
        📍 Find Me
      </button>

      {/* ── Route loading spinner ─────────────────────────────────────── */}
      {routeLoading && (
        <div style={{
          position: 'absolute', bottom: '16px', left: '16px', zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRadius: '10px', padding: '12px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '13px', color: '#161616'
        }}>
          <div style={{
            width: '16px', height: '16px', border: '2px solid #bb0000',
            borderTopColor: 'transparent', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite'
          }} />
          Calculating route…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── ETA overlay ──────────────────────────────────────────────── */}
      {eta && !routeLoading && (
        <div style={{
          position: 'absolute', bottom: '16px', left: '16px', zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderRadius: '12px', padding: '14px 18px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          minWidth: '220px', maxWidth: '300px',
          borderLeft: '4px solid #bb0000'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#bb0000', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                🚶 Walking Route
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
            <button
              onClick={handleClearEta}
              title="Clear route"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '18px', color: '#525252', padding: '0 0 0 8px',
                lineHeight: 1, flexShrink: 0
              }}
            >✕</button>
          </div>
        </div>
      )}

      {/* ── Geolocation error toast ───────────────────────────────────── */}
      {geoError && (
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, backgroundColor: '#DA1E28', color: '#fff',
          borderRadius: '8px', padding: '10px 16px',
          fontSize: '13px', fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          fontFamily: 'IBM Plex Sans, sans-serif',
          display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '90%'
        }}>
          ⚠️ {geoError}
          <button onClick={() => setGeoError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', padding: 0 }}>✕</button>
        </div>
      )}
    </div>
  )
}
