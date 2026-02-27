'use client'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import Navbar from '@/components/Navbar'

// Load the map only in the browser — mapbox-gl accesses window/WebGL APIs
// that do not exist in the server-side rendering environment.
const CampusMap = dynamic(() => import('@/components/CampusMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #EFF4FF, #F4F4F4)',
      fontFamily: 'IBM Plex Sans, sans-serif', gap: '12px'
    }}>
      <div style={{ fontSize: '32px' }}>🗺️</div>
      <p style={{ color: '#525252', fontSize: '15px', margin: 0 }}>Loading 3D Campus Map…</p>
    </div>
  )
})

// ── OSU campus locations with GPS coordinates ─────────────────────────────────
// Coordinates sourced from OpenStreetMap / Google Maps for each building.
const LOCATIONS = [
  {
    category: 'Academic Buildings',
    icon: '🏛️',
    places: [
      {
        name: 'Dreese Labs — Third Floor',
        desc: 'Computer Science & Engineering research labs, study pods, and faculty offices.',
        tag: 'CSE Hub',
        lng: -83.0119, lat: 40.0025
      },
      {
        name: 'Dreese Laboratories',
        desc: 'Main ECE and CSE building. Houses classrooms, labs, and the ECE department.',
        tag: 'Engineering',
        lng: -83.0119, lat: 40.0025
      },
      {
        name: 'Scott Laboratory',
        desc: 'Mechanical and Aerospace Engineering. Wind tunnels and advanced fabrication.',
        tag: 'Engineering',
        lng: -83.0126, lat: 40.0020
      },
      {
        name: 'McPherson Chemical Laboratory',
        desc: 'Chemistry department. Undergraduate and graduate chemistry labs.',
        tag: 'Sciences',
        lng: -83.0219, lat: 40.0008
      },
      {
        name: 'Caldwell Laboratory',
        desc: 'Physics research and undergraduate lecture halls.',
        tag: 'Sciences',
        lng: -83.0188, lat: 40.0017
      },
      {
        name: 'Knowlton Hall',
        desc: 'The Knowlton School of Architecture — studios, pin-up spaces, and workshops.',
        tag: 'Architecture',
        lng: -83.0298, lat: 39.9993
      },
      {
        name: 'Hagerty Hall',
        desc: 'Arts, humanities, and foreign language classrooms and faculty offices.',
        tag: 'Humanities',
        lng: -83.0089, lat: 40.0065
      },
      {
        name: 'Dulles Hall',
        desc: 'History department. Graduate seminars and reading rooms.',
        tag: 'Humanities',
        lng: -83.0085, lat: 40.0060
      },
      {
        name: 'Stillman Hall',
        desc: 'Fisher College of Business undergraduate programs and advising.',
        tag: 'Business',
        lng: -83.0157, lat: 40.0018
      },
    ]
  },
  {
    category: 'Libraries & Study Spaces',
    icon: '📚',
    places: [
      {
        name: 'Thompson Library',
        desc: 'OSU\'s main research library. 24-hour study floors, rare books, and digital resources.',
        tag: 'Open 24h',
        lng: -83.0122, lat: 40.0078
      },
      {
        name: 'Science & Engineering Library',
        desc: '18th Ave Library. Deep STEM collection, quiet reading rooms, and 3-D printers.',
        tag: 'STEM',
        lng: -83.0224, lat: 40.0022
      },
      {
        name: 'Health Sciences Library',
        desc: 'Primo research databases, anatomy atlases, and clinical case collections.',
        tag: 'Health',
        lng: -83.0183, lat: 40.0043
      },
      {
        name: 'Sullivant Hall Study Rooms',
        desc: 'Bookable group study rooms inside the arts complex.',
        tag: 'Group Study',
        lng: -83.0076, lat: 39.9998
      },
    ]
  },
  {
    category: 'Campus Life',
    icon: '🎓',
    places: [
      {
        name: 'Ohio Union',
        desc: 'Student government, dining, event spaces, and the Buckeye Food Co. dining hall.',
        tag: 'Student Hub',
        lng: -83.0088, lat: 40.0030
      },
      {
        name: 'The Oval',
        desc: 'Central green space and iconic OSU landmark. Great for studying outdoors.',
        tag: 'Outdoors',
        lng: -83.0094, lat: 40.0072
      },
      {
        name: 'Mirror Lake',
        desc: 'Historic reflecting pool — a favourite student relaxation and event spot.',
        tag: 'Outdoors',
        lng: -83.0084, lat: 40.0044
      },
      {
        name: 'Ohio Stadium (The Shoe)',
        desc: 'One of the largest stadiums in the world. Home of Buckeye football.',
        tag: 'Athletics',
        lng: -83.0194, lat: 40.0017
      },
      {
        name: 'Jesse Owens Memorial Stadium',
        desc: 'Track & field and soccer venue named after Olympian Jesse Owens.',
        tag: 'Athletics',
        lng: -83.0232, lat: 40.0048
      },
      {
        name: 'Recreation and Physical Activity Center (RPAC)',
        desc: 'Full gym, pools, climbing wall, and group fitness studios.',
        tag: 'Recreation',
        lng: -83.0235, lat: 40.0030
      },
    ]
  },
  {
    category: 'Health & Wellness',
    icon: '🏥',
    places: [
      {
        name: 'Wexner Medical Center',
        desc: 'OSU\'s academic medical centre. Emergency care, specialty clinics, and research.',
        tag: 'Medical',
        lng: -83.0178, lat: 40.0046
      },
      {
        name: 'Student Health Services',
        desc: 'Primary care, counselling, and immunisation services for enrolled students.',
        tag: 'Student Care',
        lng: -83.0162, lat: 40.0019
      },
      {
        name: 'Counseling and Consultation Service',
        desc: 'Mental health support, crisis counselling, and wellness workshops.',
        tag: 'Wellness',
        lng: -83.0162, lat: 40.0019
      },
    ]
  },
  {
    category: 'Transit & Access',
    icon: '🚌',
    places: [
      {
        name: 'CABS Bus System',
        desc: 'Free campus bus service with multiple routes across the Columbus campus.',
        tag: 'Free Ride',
        lng: -83.0102, lat: 40.0062
      },
      {
        name: 'Tuttle Park Place Garage',
        desc: 'Main multi-level parking garage on the north side of campus.',
        tag: 'Parking',
        lng: -83.0261, lat: 40.0139
      },
      {
        name: 'Ohio State University COTA Stop',
        desc: 'Central Ohio Transit Authority connection to downtown Columbus.',
        tag: 'Public Transit',
        lng: -83.0133, lat: 40.0060
      },
    ]
  }
]

// ── Tag colour palette (consistent with IBM Design System) ───────────────────
const TAG_COLORS = {
  'CSE Hub': { bg: '#0F62FE', fg: '#FFFFFF' },
  'Engineering': { bg: '#001D6C', fg: '#FFFFFF' },
  'Sciences': { bg: '#198038', fg: '#FFFFFF' },
  'Architecture': { bg: '#8A3FFC', fg: '#FFFFFF' },
  'Humanities': { bg: '#B28600', fg: '#FFFFFF' },
  'Business': { bg: '#005D5D', fg: '#FFFFFF' },
  'Open 24h': { bg: '#DA1E28', fg: '#FFFFFF' },
  'STEM': { bg: '#0F62FE', fg: '#FFFFFF' },
  'Health': { bg: '#9F1853', fg: '#FFFFFF' },
  'Group Study': { bg: '#393939', fg: '#FFFFFF' },
  'Student Hub': { bg: '#0F62FE', fg: '#FFFFFF' },
  'Outdoors': { bg: '#198038', fg: '#FFFFFF' },
  'Athletics': { bg: '#BB1133', fg: '#FFFFFF' },
  'Recreation': { bg: '#005D5D', fg: '#FFFFFF' },
  'Medical': { bg: '#DA1E28', fg: '#FFFFFF' },
  'Student Care': { bg: '#9F1853', fg: '#FFFFFF' },
  'Wellness': { bg: '#8A3FFC', fg: '#FFFFFF' },
  'Free Ride': { bg: '#198038', fg: '#FFFFFF' },
  'Parking': { bg: '#525252', fg: '#FFFFFF' },
  'Public Transit': { bg: '#393939', fg: '#FFFFFF' },
}

function tagStyle(tag) {
  const c = TAG_COLORS[tag] || { bg: '#E0E0E0', fg: '#161616' }
  return {
    backgroundColor: c.bg, color: c.fg,
    fontSize: '11px', fontWeight: '600',
    borderRadius: '20px', padding: '2px 9px',
    whiteSpace: 'nowrap', flexShrink: 0
  }
}

export default function CampusMapPage() {
  const [selectedDestination, setSelectedDestination] = useState(null)

  const handleSelectDestination = (place) => {
    setSelectedDestination({
      name: place.name,
      lng: place.lng,
      lat: place.lat
    })
    // Scroll to top of page to see the map
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Navbar showNav={true} />

      <div style={{
        paddingTop: '48px',
        minHeight: '100vh',
        backgroundColor: '#F4F4F4',
        fontFamily: 'IBM Plex Sans, sans-serif'
      }}>

        {/* ── 3-D Map */}
        <div style={{ width: '100%', height: '55vh', position: 'relative', flexShrink: 0 }}>
          <CampusMap
            destination={selectedDestination}
            onDestinationClear={() => setSelectedDestination(null)}
          />
        </div>

        {/* ── Navigating-to banner */}
        {selectedDestination && (
          <div style={{
            backgroundColor: '#bb0000',
            color: '#FFFFFF',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: '600',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>🚶</span>
              <span>Navigating to: <strong>{selectedDestination.name}</strong> — walking route active</span>
            </div>
            <button
              onClick={() => setSelectedDestination(null)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                flexShrink: 0
              }}
            >
              Clear Route
            </button>
          </div>
        )}

        {/* ── Section header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F62FE, #001D6C)',
          color: '#FFFFFF', padding: '20px 28px'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            OSU Columbus — Campus Locations
          </div>
          <div style={{ fontSize: '13px', color: '#93C5FD', marginTop: '4px' }}>
            {LOCATIONS.reduce((n, g) => n + g.places.length, 0)} places across {LOCATIONS.length} categories
            &nbsp;·&nbsp; Click any location to get walking directions
          </div>
        </div>

        {/* ── Building list */}
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px 48px' }}>
          {LOCATIONS.map(group => (
            <div key={group.category} style={{ marginBottom: '32px' }}>

              {/* Category header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid #0F62FE'
              }}>
                <span style={{ fontSize: '18px' }}>{group.icon}</span>
                <h2 style={{
                  margin: 0, fontSize: '16px',
                  fontWeight: 'bold', color: '#161616'
                }}>{group.category}</h2>
              </div>

              {/* Place cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px'
              }}>
                {group.places.map(place => {
                  const isSelected = selectedDestination?.name === place.name
                  return (
                    <div
                      key={place.name}
                      onClick={() => handleSelectDestination(place)}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        boxShadow: isSelected
                          ? '0 4px 16px rgba(187,0,0,0.18)'
                          : '0 1px 4px rgba(0,0,0,0.07)',
                        borderLeft: `4px solid ${isSelected ? '#bb0000' : '#0F62FE'}`,
                        display: 'flex', flexDirection: 'column', gap: '6px',
                        cursor: 'pointer',
                        transform: isSelected ? 'translateY(-2px)' : 'none',
                        transition: 'all 180ms ease',
                        outline: isSelected ? '2px solid #bb0000' : 'none',
                        outlineOffset: '1px'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.13)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'
                          e.currentTarget.style.transform = 'none'
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#161616', lineHeight: 1.4 }}>
                          {place.name}
                        </span>
                        <span style={tagStyle(place.tag)}>{place.tag}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#525252', lineHeight: 1.5 }}>
                        {place.desc}
                      </p>
                      <div style={{
                        marginTop: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: isSelected ? '#bb0000' : '#0F62FE',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isSelected ? '📍 Route active' : '🗺 Navigate here →'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center', color: '#525252', fontSize: '11px',
          padding: '16px', borderTop: '1px solid #E0E0E0'
        }}>
          Powered by IBM Granite &amp; WatsonX • IBM SkillsBuild Hackathon 2025
        </div>
      </div>
    </>
  )
}
