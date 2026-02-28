'use client'
import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// The Ohio State University — Columbus, OH
const OSU_LNG = -83.0305
const OSU_LAT = 40.0067
const DEFAULT_ZOOM = 16
const DEFAULT_PITCH = 45
const DEFAULT_BEARING = -17

export default function CampusMap() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)

  const token = process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN

  useEffect(() => {
    if (mapRef.current || !containerRef.current || !token) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [OSU_LNG, OSU_LAT],
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      antialias: true  // smoother 3-D building edges
    })

    mapRef.current = map

    // Navigation controls (zoom +/-, compass, pitch reset)
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    // Campus centre marker
    new mapboxgl.Marker({ color: '#0F62FE' })
      .setLngLat([OSU_LNG, OSU_LAT])
      .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('The Ohio State University'))
      .addTo(map)

    map.on('load', () => {
      // 3-D buildings via fill-extrusion
      // Source 'composite' + source-layer 'building' is present in streets-v12.
      // Heights fade in between zoom 15 and 15.05 so buildings pop in smoothly.
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
              15, 0,
              15.05, ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate', ['linear'], ['zoom'],
              15, 0,
              15.05, ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.72
          }
        },
        // Insert below label layers so street names stay visible on top
        map.getStyle().layers.find(l => l.type === 'symbol' && l.layout?.['text-field'])?.id
      )
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  if (!token) {
    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F62FE11, #F4F4F4)',
        fontFamily: 'IBM Plex Sans, sans-serif', gap: '12px', padding: '24px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px' }}>🗺️</div>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#161616' }}>3D Campus Map</h2>
        <p style={{ margin: 0, color: '#525252', fontSize: '14px', maxWidth: '400px' }}>
          The interactive 3D campus map requires a Mapbox API token.
          Set <code>NEXT_PUBLIC_MAPBOX_API_TOKEN</code> in your <code>.env.local</code> file to enable this feature.
        </p>
        <a href="/map" style={{
          marginTop: '12px', backgroundColor: '#0F62FE', color: '#FFFFFF',
          padding: '10px 24px', borderRadius: '8px', textDecoration: 'none',
          fontSize: '14px', fontWeight: '600'
        }}>View Sensory Map Instead →</a>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  )
}
