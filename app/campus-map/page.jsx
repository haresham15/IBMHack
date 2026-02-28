'use client'
import dynamic from 'next/dynamic'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import { useStoredUIConfig } from '@/lib/useUIConfig'

const CampusMap = dynamic(() => import('@/components/CampusMap'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', background: 'linear-gradient(135deg,#EFF4FF,#F4F4F4)',
      fontFamily: 'IBM Plex Sans,sans-serif', gap: '12px'
    }}>
      <div style={{ fontSize: '32px' }}>🗺️</div>
      <p style={{ color: '#525252', fontSize: '15px', margin: 0 }}>Loading 3D Campus Map…</p>
    </div>
  )
})

// ── VERIFIED OSU COORDINATES ─────────────────────────────────────────────────
// All [lng, lat] pairs verified against OSU campus geography.
// Dreese Labs anchor: [-83.0159, 40.0022] (user-confirmed)
// Ohio Union: [-83.0083, 40.0033] (corrected from displaced -83.0091, 39.9977)
// Thompson Library: [-83.0122, 40.0078] (corrected from displaced -83.0150, 39.9991)
// ─────────────────────────────────────────────────────────────────────────────
const LOCATIONS = [
  {
    category: 'Academic Buildings', icon: '🏛️',
    places: [
      { name: 'Dreese Labs — Third Floor', desc: 'CSE research labs, study pods, and faculty offices.', tag: 'CSE Hub', type: 'academic', noiseLevel: 'low', navDesc: 'Brick tower at W 19th Ave & Neil Ave — CSE signage overhang.', lng: -83.0159, lat: 40.0022 },
      { name: 'Dreese Laboratories', desc: 'Main ECE and CSE building with classrooms, labs, and ECE dept.', tag: 'Engineering', type: 'academic', noiseLevel: 'medium', navDesc: 'Same brick complex as Dreese Labs. Main entrance faces Neil Ave.', lng: -83.0159, lat: 40.0022 },
      { name: 'Scott Laboratory', desc: 'Mechanical & Aerospace Engineering. Wind tunnels, fabrication.', tag: 'Engineering', type: 'academic', noiseLevel: 'medium', navDesc: 'Five-story brick building directly south of Dreese Labs on W 19th Ave.', lng: -83.0155, lat: 40.0016 },
      { name: 'McPherson Chemical Laboratory', desc: 'Undergraduate and graduate chemistry labs.', tag: 'Sciences', type: 'academic', noiseLevel: 'low', navDesc: 'Red-brick building at 140 W 18th Ave — exhaust stacks visible from street.', lng: -83.0148, lat: 40.0016 },
      { name: 'Caldwell Laboratory', desc: 'Physics research and undergraduate lecture halls.', tag: 'Sciences', type: 'academic', noiseLevel: 'low', navDesc: 'Grey concrete building next to the Physics Research building on W 18th Ave.', lng: -83.0129, lat: 40.0021 },
      { name: 'Knowlton Hall', desc: 'Knowlton School of Architecture — studios and workshops.', tag: 'Architecture', type: 'academic', noiseLevel: 'medium', navDesc: 'Distinctive glass-and-steel box on Neil Ave, across from the Wexner Center.', lng: -83.0157, lat: 40.0048 },
      { name: 'Hagerty Hall', desc: 'Arts, humanities, and foreign language classrooms.', tag: 'Humanities', type: 'academic', noiseLevel: 'medium', navDesc: 'Tall brick building on the north side of The Oval, facing College Ave.', lng: -83.0097, lat: 40.0063 },
      { name: 'Dulles Hall', desc: 'History department. Graduate seminars and reading rooms.', tag: 'Humanities', type: 'academic', noiseLevel: 'low', navDesc: 'Buff-brick building east of Hagerty Hall near College Rd and E 12th.', lng: -83.0087, lat: 40.0058 },
      { name: 'Stillman Hall', desc: 'Fisher College of Business undergraduate programs.', tag: 'Business', type: 'academic', noiseLevel: 'medium', navDesc: 'White limestone facade on W 19th Ave, west of the Engineering quad.', lng: -83.0164, lat: 40.0020 },
      { name: 'Hitchcock Hall', desc: 'Civil and Environmental Engineering lecture halls and labs.', tag: 'Engineering', type: 'academic', noiseLevel: 'medium', navDesc: 'Beige stone building at the corner of W 18th Ave and Neil Ave.', lng: -83.0162, lat: 40.0032 },
      { name: 'Enarson Classroom Building', desc: 'High-capacity general university classroom building.', tag: 'Classroom', type: 'academic', noiseLevel: 'high', navDesc: 'Brown brick building on The Oval south-west corner near W 12th Ave.', lng: -83.0113, lat: 40.0054 },
      { name: 'Smith Laboratory', desc: 'Physics and chemistry research floors, connected to Watts Hall.', tag: 'Sciences', type: 'academic', noiseLevel: 'low', navDesc: 'Brown brick complex facing W 18th Ave between Neil Ave and Millikin Rd.', lng: -83.0154, lat: 40.0018 },
      { name: 'Watts Hall', desc: 'Materials Science & Engineering classrooms and research labs.', tag: 'Engineering', type: 'academic', noiseLevel: 'medium', navDesc: 'Connected to Smith Lab — brick building with white window frames on Neil Ave.', lng: -83.0161, lat: 40.0026 },
      { name: 'Bolz Hall', desc: 'Industrial & Systems Engineering. Operations research labs.', tag: 'Engineering', type: 'academic', noiseLevel: 'low', navDesc: 'Tall dark-brick building between Dreese Labs and the Physics Research Building.', lng: -83.0147, lat: 40.0028 },
      { name: 'Jennings Hall', desc: 'Multi-department STEM teaching building with seminar rooms.', tag: 'Sciences', type: 'academic', noiseLevel: 'medium', navDesc: 'Grey concrete building at the north end of the science corridor on W 19th Ave.', lng: -83.0139, lat: 40.0022 },
      { name: 'Arps Hall', desc: 'College of Education — classrooms, labs, and faculty offices.', tag: 'Education', type: 'academic', noiseLevel: 'medium', navDesc: 'Brick building on the west side of The Oval, along College Rd.', lng: -83.0115, lat: 40.0057 },
      { name: 'Baker Systems Engineering Bldg', desc: 'Industrial Engineering research labs and graduate program offices.', tag: 'Engineering', type: 'academic', noiseLevel: 'low', navDesc: 'Grey modernist building at the corner of W 19th Ave and Millikin Rd.', lng: -83.0176, lat: 40.0028 },
      { name: 'Pomerene Hall', desc: 'Dance, human nutrition, and kinesiology teaching spaces.', tag: 'Education', type: 'academic', noiseLevel: 'medium', navDesc: 'Brick building on the south side of Mirror Lake, facing E 17th Ave.', lng: -83.0080, lat: 40.0038 },
    ]
  },
  {
    category: 'Residence Halls', icon: '🛏️',
    places: [
      { name: 'Taylor Tower', desc: 'High-rise dormitory near Mirror Lake. 500+ residents.', tag: 'Dorm', type: 'dorm', noiseLevel: 'high', navDesc: 'Tall T-shaped tower on W Lane Ave — recognisable from most of campus.', lng: -83.0163, lat: 40.0039 },
      { name: 'Morrill Tower', desc: 'South campus high-rise with dining on the ground floor.', tag: 'Dorm', type: 'dorm', noiseLevel: 'high', navDesc: 'Tall red-brick tower on W Lane Ave near the RPAC — visible from the stadium.', lng: -83.0219, lat: 40.0001 },
      { name: 'Lincoln Tower', desc: 'Co-ed high-rise with panoramic views of Columbus.', tag: 'Dorm', type: 'dorm', noiseLevel: 'high', navDesc: 'Identical tall tower directly south of Morrill Tower on S Oval Dr.', lng: -83.0220, lat: 39.9985 },
      { name: 'Archer House', desc: 'Part of the Torres/Archer complex. Suite-style living.', tag: 'Dorm', type: 'dorm', noiseLevel: 'medium', navDesc: 'Modern building complex on W Lane Ave, a short walk from Mirror Lake.', lng: -83.0142, lat: 40.0051 },
      { name: 'Park-Stradley Hall', desc: 'Traditional residence hall near Mirror Lake and the Ohio Union.', tag: 'Dorm', type: 'dorm', noiseLevel: 'medium', navDesc: 'Red-brick hall on the south bank of Mirror Lake, connected to Smith-Steeb.', lng: -83.0088, lat: 40.0040 },
      { name: 'Bradley Hall', desc: 'Renovated high-capacity residence hall near S High St.', tag: 'Dorm', type: 'dorm', noiseLevel: 'high', navDesc: 'Square brick building at the corner of Bradley Ave and S High St.', lng: -83.0101, lat: 40.0005 },
      { name: 'Drackett Tower', desc: 'North campus high-rise. Close to the RPAC and Jesse Owens Stadium.', tag: 'Dorm', type: 'dorm', noiseLevel: 'high', navDesc: 'Brutalist concrete tower on Woody Hayes Dr, visible from Tuttle Park.', lng: -83.0160, lat: 40.0080 },
      { name: 'Traditions at Scott', desc: 'Modern suite-style dorm attached to the north Oval area.', tag: 'Dorm', type: 'dorm', noiseLevel: 'medium', navDesc: 'New-construction glass building on N High St near Lane Ave — blue panels.', lng: -83.0102, lat: 40.0086 },
      { name: 'Steeb Hall', desc: 'All-female residence hall near Mirror Lake.', tag: 'Dorm', type: 'dorm', noiseLevel: 'medium', navDesc: 'Red-brick hall connected to Park-Stradley on south end of Mirror Lake.', lng: -83.0089, lat: 40.0036 },
      { name: 'Morrison Tower', desc: 'North campus high-rise close to RPAC and the football stadium.', tag: 'Dorm', type: 'dorm', noiseLevel: 'high', navDesc: 'Tallest building on north campus, visible from Tuttle Garage on the left.', lng: -83.0210, lat: 40.0075 },
    ]
  },
  {
    category: 'Libraries & Study Spaces', icon: '📚',
    places: [
      // CORRECTED: Thompson Library [-83.0122, 40.0078] (was displaced to -83.0150, 39.9991)
      { name: 'Thompson Library', desc: "OSU's main research library. 24-hour study floors, rare books.", tag: 'Open 24h', type: 'library', noiseLevel: 'low', navDesc: 'Limestone facade at the north end of The Oval — look for the stone arch entrance.', lng: -83.0122, lat: 40.0078 },
      { name: 'Science & Engineering Library', desc: '18th Ave Library. STEM collection, quiet rooms, 3-D printers.', tag: 'STEM', type: 'library', noiseLevel: 'low', navDesc: 'Low brick building on W 18th Ave directly east of the science corridor.', lng: -83.0224, lat: 40.0022 },
      { name: 'Health Sciences Library', desc: 'Anatomy atlases, clinical databases, and case collections.', tag: 'Health', type: 'library', noiseLevel: 'low', navDesc: 'Inside Hamilton Hall at the Wexner Medical Center south entrance.', lng: -83.0199, lat: 40.0047 },
      { name: 'Sullivant Hall Study Rooms', desc: 'Bookable group study rooms inside the arts complex.', tag: 'Group Study', type: 'library', noiseLevel: 'low', navDesc: 'Ornate limestone arts building on W Broad St — distinctive dome and columns.', lng: -83.0080, lat: 40.0002 },
    ]
  },
  {
    category: 'Campus Life', icon: '🎓',
    places: [
      // CORRECTED: Ohio Union [-83.0083, 40.0033] (was displaced to -83.0091, 39.9977)
      { name: 'Ohio Union', desc: 'Student government, dining, events, and Buckeye Food Co.', tag: 'Student Hub', type: 'campus-life', noiseLevel: 'high', navDesc: 'Large glass-brick building at the corner of High St and E 17th Ave.', lng: -83.0083, lat: 40.0033 },
      { name: 'The Oval', desc: 'Central green space and iconic OSU landmark.', tag: 'Outdoors', type: 'campus-life', noiseLevel: 'medium', navDesc: 'Open grass oval — the large fountain and Orton Hall tower mark the south end.', lng: -83.0099, lat: 40.0072 },
      { name: 'Mirror Lake', desc: 'Historic reflecting pool — student relaxation and event spot.', tag: 'Outdoors', type: 'campus-life', noiseLevel: 'low', navDesc: 'Sunken reflecting pool east of Ohio Union. Visible from E 17th Ave bridge.', lng: -83.0082, lat: 40.0044 },
      { name: 'Ohio Stadium (The Shoe)', desc: 'One of the largest stadiums in the world. Buckeye football home.', tag: 'Athletics', type: 'athletics', noiseLevel: 'high', navDesc: 'Massive horseshoe stadium — visible from anywhere on west campus.', lng: -83.0194, lat: 40.0017 },
      { name: 'Jesse Owens Memorial Stadium', desc: 'Track & field and soccer venue named after Jesse Owens.', tag: 'Athletics', type: 'athletics', noiseLevel: 'medium', navDesc: 'Oval track next to the RPAC on Cannon Dr — red synthetic track surface.', lng: -83.0228, lat: 40.0040 },
      { name: 'RPAC', desc: 'Full gym, pools, climbing wall, and group fitness studios.', tag: 'Recreation', type: 'athletics', noiseLevel: 'high', navDesc: 'Large glass-brick recreation complex on Cannon Dr adjacent to Jesse Owens.', lng: -83.0235, lat: 40.0033 },
      { name: 'South Oval Dining', desc: 'Dining hall serving breakfast, lunch, and dinner on south campus.', tag: 'Dining', type: 'campus-life', noiseLevel: 'high', navDesc: 'Round brick building at the south end of The Oval near Hagerty Hall.', lng: -83.0102, lat: 40.0049 },
    ]
  },
  {
    category: 'Health & Wellness', icon: '🏥',
    places: [
      { name: 'Wexner Medical Center', desc: "OSU's academic medical centre. Emergency and speciality clinics.", tag: 'Medical', type: 'health', noiseLevel: 'medium', navDesc: 'Large hospital complex at the corner of Neil Ave and W Woodruff Ave.', lng: -83.0195, lat: 40.0045 },
      { name: 'Student Health Services', desc: 'Primary care, counselling, and immunisation for students.', tag: 'Student Care', type: 'health', noiseLevel: 'low', navDesc: 'Brick building attached to Wilce Student Health Center on Millikin Rd.', lng: -83.0126, lat: 40.0019 },
      { name: 'Counseling and Consultation Service', desc: 'Mental health support, crisis counselling, workshops.', tag: 'Wellness', type: 'health', noiseLevel: 'low', navDesc: 'Office suite in the Younkin Success Center, south side of campus.', lng: -83.0130, lat: 40.0017 },
      { name: 'Younkin Success Center', desc: 'Academic success coaching, tutoring, disability services.', tag: 'Accessibility', type: 'health', noiseLevel: 'low', navDesc: 'Brick building at the corner of E 17th Ave and College Rd East.', lng: -83.0063, lat: 40.0041 },
    ]
  },
  {
    category: 'Transit & Access', icon: '🚌',
    places: [
      { name: 'CABS Bus Hub', desc: 'Free campus bus — multiple routes across the Columbus campus.', tag: 'Free Ride', type: 'transit', noiseLevel: 'medium', navDesc: "Main CABS stop is the covered shelter on The Oval's north edge (Woodruff Ave).", lng: -83.0102, lat: 40.0062 },
      { name: 'Tuttle Park Place Garage', desc: 'Main multi-level parking garage on the north side of campus.', tag: 'Parking', type: 'transit', noiseLevel: 'low', navDesc: 'Large concrete garage off Tuttle Park Pl — visible from W Woodruff Ave.', lng: -83.0261, lat: 40.0050 },
      { name: 'OSU COTA Stop (Lane)', desc: 'Central Ohio Transit Authority connection to downtown Columbus.', tag: 'Public Transit', type: 'transit', noiseLevel: 'medium', navDesc: 'COTA shelter at N High St and E Lane Ave — distinctive blue bus signs.', lng: -83.0059, lat: 40.0097 },
    ]
  },
]

const ALL_PLACES = LOCATIONS.flatMap(cat => cat.places.map(p => ({ ...p, category: cat.category, icon: cat.icon })))

const TAG_COLORS = {
  'CSE Hub': '#0F62FE', 'Engineering': '#001D6C', 'Sciences': '#198038', 'Architecture': '#8A3FFC',
  'Humanities': '#B28600', 'Business': '#005D5D', 'Classroom': '#6F6F6F', 'Education': '#9F1853',
  'Open 24h': '#DA1E28', 'STEM': '#0F62FE', 'Health': '#9F1853', 'Group Study': '#393939',
  'Student Hub': '#0F62FE', 'Outdoors': '#198038', 'Athletics': '#BB1133', 'Recreation': '#005D5D',
  'Medical': '#DA1E28', 'Student Care': '#9F1853', 'Wellness': '#8A3FFC', 'Accessibility': '#0F62FE',
  'Free Ride': '#198038', 'Parking': '#525252', 'Public Transit': '#393939', 'Dorm': '#006161', 'Dining': '#8A3FFC',
}

function tagStyle(tag) {
  const c = TAG_COLORS[tag] || { bg: '#E0E0E0', fg: '#161616' }
  return {
    backgroundColor: c, color: '#fff', fontSize: '11px', fontWeight: '600',
    borderRadius: '20px', padding: '2px 9px', letterSpacing: '.02em', whiteSpace: 'nowrap', flexShrink: 0
  }
}

function routeColorFromType(type) {
  if (type === 'dorm' || type === 'athletics' || type === 'campus-life') return '#00E676'
  if (type === 'academic' || type === 'library') return '#0070FF'
  return '#bb0000'
}

function noiseBadge(level) {
  if (level === 'high') return { label: '🔊 High Noise', color: '#DA1E28' }
  if (level === 'medium') return { label: '🔉 Med Noise', color: '#B28600' }
  return { label: '🤫 Quiet', color: '#198038' }
}

function maneuverEmoji(type, modifier) {
  if (type === 'arrive') return '🏁'
  if (type === 'depart') return '🚶'
  if (modifier === 'left' || modifier === 'sharp left') return '⬅️'
  if (modifier === 'right' || modifier === 'sharp right') return '➡️'
  if (modifier === 'uturn') return '🔄'
  return '⬆️'
}

// ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
export default function CampusMapPage() {
  useStoredUIConfig()
  const [pendingDest, setPendingDest] = useState(null)   // picked but not started
  const [selectedDestination, setSelectedDestination] = useState(null)  // route active
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // ── Checkpoint / direction state ─────────────────────────────────────────
  const [checkpoints, setCheckpoints] = useState([])   // step objects from API
  const [activeIdx, setActiveIdx] = useState(0)
  const [completedIdxs, setCompletedIdxs] = useState(new Set())
  const [totalDistM, setTotalDistM] = useState(0)
  const [remainingDistM, setRemainingDistM] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState(null)
  const [modalCountdown, setModalCountdown] = useState(6)
  const [manualOpen, setManualOpen] = useState(true)

  const checkpointsRef = useRef([])

  const categories = ['All', ...LOCATIONS.map(c => c.category)]
  const activeColor = selectedDestination ? routeColorFromType(selectedDestination.type) : '#bb0000'

  // ── ML Config from sessionStorage / localStorage ─────────────────────────
  const [mlConfig, setMlConfig] = useState(null)
  const [disorders, setDisorders] = useState([])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('vantage_ui_config')
      if (stored) setMlConfig(JSON.parse(stored))
    } catch { }
    try {
      const d = localStorage.getItem('vantage_disorders')
      if (d) setDisorders(JSON.parse(d))
    } catch { }
  }, [])

  // Derive map style from color theme
  const mapStyle = useMemo(() => {
    if (mlConfig?.color_theme === 'dark') return 'mapbox://styles/mapbox/dark-v11'
    if (mlConfig?.color_theme === 'cream' || mlConfig?.color_theme === 'warm') return 'mapbox://styles/mapbox/outdoors-v12'
    return 'mapbox://styles/mapbox/streets-v12'
  }, [mlConfig])

  // Auto-enable Focus Mode for ADHD/ASD
  const autoFocusMode = disorders.includes('adhd') || disorders.includes('asd')

  // Noise sensitivity: pre-filter to quiet places for SPD/ASD/anxiety
  const noiseSensitive = disorders.some(d => ['spd', 'asd', 'anxiety'].includes(d))

  const filteredLocations = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return LOCATIONS
      .filter(cat => categoryFilter === 'All' || cat.category === categoryFilter)
      .map(cat => ({
        ...cat,
        places: cat.places
          .filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.desc.toLowerCase().includes(q) ||
            p.tag.toLowerCase().includes(q) ||
            (p.navDesc?.toLowerCase().includes(q) ?? false)
          )
          // Quiet-first sort for noise-sensitive profiles
          .sort((a, b) => {
            if (!noiseSensitive) return 0
            const nOrder = { low: 0, medium: 1, high: 2 }
            return (nOrder[a.noiseLevel] ?? 1) - (nOrder[b.noiseLevel] ?? 1)
          })
      }))
      .filter(cat => cat.places.length > 0)
  }, [searchQuery, categoryFilter, noiseSensitive])

  // ── Callbacks from CampusMap ─────────────────────────────────────────────
  const handleWaypointsReady = useCallback((steps, distM) => {
    checkpointsRef.current = steps
    setCheckpoints(steps)
    setTotalDistM(distM)
    setRemainingDistM(distM)
    setCompletedIdxs(new Set())
    const firstTurn = steps.findIndex(s => s.type !== 'depart')
    setActiveIdx(firstTurn >= 0 ? firstTurn : 0)
  }, [])

  const handleCheckpointHit = useCallback((idx) => {
    setCompletedIdxs(prev => { const n = new Set(prev); n.add(idx); return n })
    setActiveIdx(idx + 1)
    const step = checkpointsRef.current[idx]
    if (step && step.type !== 'depart' && step.type !== 'arrive') {
      setModalStep(step)
      setModalCountdown(6)
      setShowModal(true)
    }
  }, [])

  const handlePosUpdate = useCallback((lng, lat, remainM) => {
    setRemainingDistM(remainM)
  }, [])

  // ── Modal countdown auto-dismiss ─────────────────────────────────────────
  const dismissModal = useCallback(() => { setShowModal(false); setModalStep(null); setModalCountdown(6) }, [])
  useEffect(() => {
    if (!showModal) return
    if (modalCountdown <= 0) { dismissModal(); return }
    const t = setTimeout(() => setModalCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [showModal, modalCountdown, dismissModal])

  const handleSelectDest = (place) => {
    setPendingDest({ name: place.name, lng: place.lng, lat: place.lat, tag: place.tag, type: place.type, navDesc: place.navDesc ?? '' })
    setSelectedDestination(null)   // clear active route
    setCheckpoints([])
    setTotalDistM(0)
    setRemainingDistM(0)
    setActiveIdx(0)
    setCompletedIdxs(new Set())
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleStartRoute = () => {
    if (!pendingDest) return
    setSelectedDestination(pendingDest)
    setPendingDest(null)
  }

  const handleClearRoute = () => {
    setSelectedDestination(null)
    setPendingDest(null)
    setCheckpoints([])
    setTotalDistM(0)
    setRemainingDistM(0)
    setActiveIdx(0)
    setCompletedIdxs(new Set())
    setShowModal(false)
  }

  // ── Progress circle dims ─────────────────────────────────────────────────
  const R = 34, circ = 2 * Math.PI * R
  const progressFrac = totalDistM > 0 ? Math.max(0, Math.min(1, 1 - remainingDistM / totalDistM)) : 0
  const dashOffset = circ * (1 - progressFrac)

  // ── Current instruction / direction bar ──────────────────────────────────
  const activeStep = checkpoints[activeIdx]
  const prevStep = activeIdx > 0 ? checkpoints[activeIdx - 1] : null
  const dirBarText = !selectedDestination
    ? 'Select a building below and press Start Route'
    : activeStep?.type === 'arrive'
      ? 'You have arrived at your destination 🏁'
      : (activeStep?.instruction ?? 'Follow the route line on the map')
  const dirBarIcon = activeStep ? maneuverEmoji(activeStep.type, activeStep.modifier) : '🗺️'

  return (
    <>
      <Navbar showNav={true} />

      {/* ── Direction Modal ─────────────────────────────────────────────── */}
      {showModal && modalStep && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.78)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px'
        }} onClick={dismissModal}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '40px 36px',
            maxWidth: '480px', width: '100%', textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
            borderTop: `6px solid ${activeColor}`
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>
              {maneuverEmoji(modalStep.type, modalStep.modifier)}
            </div>
            <div style={{
              fontSize: '32px', fontWeight: '900', color: '#bb0000',
              textTransform: 'uppercase', letterSpacing: '.04em', lineHeight: 1.2, marginBottom: '12px'
            }}>
              {modalStep.modifier ? `Turn ${modalStep.modifier}` : modalStep.type}
            </div>
            <div style={{ fontSize: '18px', color: '#161616', fontWeight: '600', marginBottom: '8px', fontFamily: 'IBM Plex Sans,sans-serif' }}>
              {modalStep.instruction}
            </div>
            {modalStep.name && (
              <div style={{ fontSize: '14px', color: '#525252', marginBottom: '24px', fontStyle: 'italic' }}>
                at {modalStep.name}
              </div>
            )}
            <div style={{ width: '100%', height: '4px', backgroundColor: '#E0E0E0', borderRadius: '2px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', backgroundColor: activeColor, borderRadius: '2px',
                width: `${(modalCountdown / 6) * 100}%`, transition: 'width 1s linear'
              }} />
            </div>
            <div style={{ fontSize: '13px', color: '#525252', marginBottom: '20px' }}>
              Auto-dismissing in {modalCountdown}s
            </div>
            <button onClick={dismissModal} style={{
              backgroundColor: activeColor, color: '#fff', border: 'none',
              borderRadius: '12px', padding: '12px 32px', fontSize: '16px', fontWeight: '700',
              cursor: 'pointer', fontFamily: 'IBM Plex Sans,sans-serif'
            }}>Got it →</button>
          </div>
        </div>
      )}

      <div style={{ paddingTop: '48px', minHeight: '100vh', backgroundColor: '#F4F4F4', fontFamily: 'IBM Plex Sans,sans-serif' }}>

        {/* ══ MAP ROW: [Manual Sidebar | Map] ════════════════════════════════ */}
        <div style={{ display: 'flex', height: '58vh', position: 'relative' }}>

          {/* ── Navigation Manual Sidebar ────────────────────────────────── */}
          <div style={{
            width: manualOpen ? '280px' : '44px',
            flexShrink: 0, backgroundColor: '#0F172A',
            display: 'flex', flexDirection: 'column',
            transition: 'width 280ms ease', overflow: 'hidden',
            borderRight: '1px solid rgba(255,255,255,0.08)'
          }}>

            {/* Sidebar header */}
            <div style={{
              padding: '12px 12px 8px', display: 'flex', alignItems: 'center', gap: '8px',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <button onClick={() => setManualOpen(o => !o)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer', fontSize: '18px', padding: '2px', flexShrink: 0,
                transition: 'transform 200ms ease', transform: manualOpen ? 'rotate(0deg)' : 'rotate(180deg)'
              }}>◀</button>
              {manualOpen && (
                <span style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  🧭 Navigation Manual
                </span>
              )}
            </div>

            {manualOpen && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

                {/* No route — prompt */}
                {!selectedDestination && !pendingDest && (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center', marginTop: '24px', lineHeight: 1.6 }}>
                    Pick a building from the directory below,<br />then press <strong style={{ color: '#00E676' }}>Start Route</strong>
                  </div>
                )}

                {/* Pending — show Start Route prompt */}
                {pendingDest && !selectedDestination && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.06em' }}>Ready to navigate</div>
                    <div style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>{pendingDest.name}</div>
                    <button onClick={handleStartRoute} style={{
                      width: '100%', backgroundColor: routeColorFromType(pendingDest.type),
                      color: '#000', border: 'none', borderRadius: '10px', padding: '11px',
                      fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                      fontFamily: 'IBM Plex Sans,sans-serif',
                      boxShadow: `0 0 16px ${routeColorFromType(pendingDest.type)}66`
                    }}>▶ Start Route</button>
                  </div>
                )}

                {/* Active route — progress circle + checklist */}
                {selectedDestination && (
                  <>
                    {/* Progress Circle */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px' }}>
                      <div style={{ position: 'relative', width: '88px', height: '88px' }}>
                        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="7" />
                          <circle cx="44" cy="44" r={R} fill="none" stroke={activeColor} strokeWidth="7"
                            strokeDasharray={circ} strokeDashoffset={dashOffset} strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        </svg>
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                          textAlign: 'center', color: '#FFFFFF'
                        }}>
                          <div style={{ fontSize: '18px', fontWeight: '800', lineHeight: 1 }}>{Math.round(progressFrac * 100)}%</div>
                          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>done</div>
                        </div>
                      </div>
                      <div style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: '700', marginTop: '6px', textAlign: 'center' }}>
                        {selectedDestination.name}
                      </div>
                      {remainingDistM > 0 && (
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                          {remainingDistM < 1000
                            ? `${Math.round(remainingDistM)}m remaining`
                            : `${(remainingDistM / 1000).toFixed(1)}km remaining`}
                        </div>
                      )}
                    </div>

                    {/* Checkpoint list */}
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '8px' }}>
                      Checkpoints
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {checkpoints.map((cp, idx) => {
                        const done = completedIdxs.has(idx)
                        const current = idx === activeIdx
                        return (
                          <div key={idx} style={{
                            padding: '8px 10px', borderRadius: '8px',
                            backgroundColor: current ? `${activeColor}22` : 'transparent',
                            border: current ? `1px solid ${activeColor}66` : '1px solid transparent',
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                            opacity: done ? 0.4 : 1,
                            transition: 'all 300ms ease'
                          }}>
                            <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>
                              {done ? '✅' : current ? '📍' : '○'}
                            </span>
                            <div>
                              <div style={{
                                fontSize: '12px', fontWeight: current ? '700' : '500',
                                color: current ? activeColor : (done ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)'),
                                textDecoration: done ? 'line-through' : 'none', lineHeight: 1.3
                              }}>
                                {cp.instruction}
                              </div>
                              {cp.distanceM > 0 && !done && (
                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                                  {Math.round(cp.distanceM)}m
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <button onClick={handleClearRoute} style={{
                      marginTop: '14px', width: '100%', backgroundColor: 'transparent',
                      border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)',
                      borderRadius: '8px', padding: '8px', fontSize: '12px', cursor: 'pointer',
                      fontFamily: 'IBM Plex Sans,sans-serif'
                    }}>✕ Clear Route</button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Map (takes remaining width) ──────────────────────────────── */}
          <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
            <CampusMap
              destination={selectedDestination}
              onDestinationClear={handleClearRoute}
              onWaypointsReady={handleWaypointsReady}
              onCheckpointHit={handleCheckpointHit}
              onPosUpdate={handlePosUpdate}
              mapStyle={mapStyle}
              autoFocusMode={autoFocusMode}
              disorders={disorders}
            />
          </div>
        </div>

        {/* ══ PERSISTENT DIRECTION BAR ════════════════════════════════════════ */}
        <div style={{
          backgroundColor: selectedDestination ? '#0F172A' : '#1C1C1E',
          borderTop: `3px solid ${selectedDestination ? activeColor : '#393939'}`,
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: '18px',
          minHeight: '70px'
        }}>
          <span style={{ fontSize: '36px', flexShrink: 0 }}>{dirBarIcon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '19px', fontWeight: '800', color: '#FFFFFF',
              lineHeight: 1.3, wordBreak: 'break-word'
            }}>{dirBarText}</div>
            {selectedDestination && activeStep && activeStep.type !== 'arrive' && activeStep.distanceM > 0 && (
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
                {Math.round(activeStep.distanceM)}m to next turn · {Math.round(remainingDistM)}m total remaining
              </div>
            )}
          </div>
          {pendingDest && !selectedDestination && (
            <button onClick={handleStartRoute} style={{
              backgroundColor: routeColorFromType(pendingDest.type), color: '#000',
              border: 'none', borderRadius: '10px', padding: '12px 24px',
              fontSize: '15px', fontWeight: '800', cursor: 'pointer',
              fontFamily: 'IBM Plex Sans,sans-serif', flexShrink: 0,
              boxShadow: `0 0 20px ${routeColorFromType(pendingDest.type)}55`
            }}>▶ Start Route</button>
          )}
        </div>

        {/* ══ SEARCHABLE CAMPUS DIRECTORY ══════════════════════════════════════ */}
        <div style={{ padding: '24px 24px 60px', maxWidth: '1280px', margin: '0 auto' }}>

          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#161616' }}>OSU Campus Directory</h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#525252' }}>
                {ALL_PLACES.length} places ·{' '}
                {pendingDest
                  ? <span style={{ color: routeColorFromType(pendingDest.type), fontWeight: '700' }}>
                    ✓ {pendingDest.name} selected — press Start Route to begin
                  </span>
                  : 'Click any card to select a destination'}
              </p>
            </div>
          </div>

          {/* ML Recommendation Banner */}
          {disorders.length > 0 && (
            <div style={{
              backgroundColor: noiseSensitive ? '#EDF5FF' : '#DEFBE6',
              border: `1px solid ${noiseSensitive ? '#BAE6FF' : '#A7F0BA'}`,
              borderRadius: '10px', padding: '12px 18px', marginBottom: '20px',
              display: 'flex', alignItems: 'flex-start', gap: '12px'
            }}>
              <span style={{ fontSize: '22px', flexShrink: 0 }}>🧠</span>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#161616', marginBottom: '4px' }}>
                  AI-personalised campus view
                </div>
                <div style={{ fontSize: '13px', color: '#525252', lineHeight: 1.5 }}>
                  {noiseSensitive
                    ? 'Quiet spaces are sorted first based on your sensory profile. Focus Mode is ' + (autoFocusMode ? 'auto-enabled' : 'available') + ' on the map.'
                    : 'Landmark anchors on your route will be filtered to locations most relevant to your profile.'}
                  {' '}Map style: <strong>{mlConfig?.color_theme ?? 'default'}</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Search + filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '200px' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
              <input type="text" placeholder="Search buildings, tags, or descriptions…"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 40px', fontSize: '14px', fontFamily: 'IBM Plex Sans,sans-serif',
                  border: '1.5px solid #C6C6C6', borderRadius: '8px', backgroundColor: '#FFFFFF',
                  color: '#161616', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms'
                }}
                onFocus={e => e.target.style.borderColor = '#0070FF'}
                onBlur={e => e.target.style.borderColor = '#C6C6C6'} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} style={{
                  padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                  fontFamily: 'IBM Plex Sans,sans-serif', cursor: 'pointer', border: '1.5px solid',
                  backgroundColor: categoryFilter === cat ? '#161616' : '#FFFFFF',
                  color: categoryFilter === cat ? '#FFFFFF' : '#525252',
                  borderColor: categoryFilter === cat ? '#161616' : '#C6C6C6', transition: 'all 150ms ease'
                }}>
                  {LOCATIONS.find(l => l.category === cat)?.icon ?? '🗂️'} {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredLocations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#525252', fontSize: '15px', backgroundColor: '#FFFFFF', borderRadius: '12px' }}>
              No locations match "<strong>{searchQuery}</strong>"
            </div>
          )}

          {filteredLocations.map(cat => (
            <div key={cat.category} style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#161616' }}>{cat.category}</h3>
                <span style={{ fontSize: '12px', color: '#6F6F6F', backgroundColor: '#E8E8E8', borderRadius: '10px', padding: '1px 8px' }}>{cat.places.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '12px' }}>
                {cat.places.map(place => {
                  const isPending = pendingDest?.name === place.name && !selectedDestination
                  const isActive = selectedDestination?.name === place.name
                  const noise = noiseBadge(place.noiseLevel)
                  const cardColor = isPending || isActive ? routeColorFromType(place.type) : null
                  return (
                    <div key={place.name} onClick={() => handleSelectDest(place)}
                      style={{
                        backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '14px 16px',
                        cursor: 'pointer',
                        border: isPending ? `2px solid ${cardColor}` : isActive ? `2px solid ${cardColor}` : '2px solid transparent',
                        boxShadow: isPending || isActive
                          ? `0 0 0 3px ${cardColor}33,0 2px 12px rgba(0,0,0,0.1)`
                          : '0 1px 4px rgba(0,0,0,0.07)',
                        transition: 'all 180ms ease', display: 'flex', flexDirection: 'column', gap: '6px'
                      }}
                      onMouseEnter={e => { if (!isPending && !isActive) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.13)' }}
                      onMouseLeave={e => { if (!isPending && !isActive) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#161616', lineHeight: 1.3, flex: 1 }}>{place.name}</div>
                        <span style={tagStyle(place.tag)}>{place.tag}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#525252', lineHeight: 1.45 }}>{place.desc}</div>
                      {place.navDesc && (
                        <div style={{ fontSize: '11px', color: '#0070FF', fontStyle: 'italic', lineHeight: 1.4 }}>🧭 {place.navDesc}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: noise.color }}>{noise.label}</span>
                        {isActive ? (
                          <span style={{ fontSize: '12px', fontWeight: '700', color: cardColor }}>📍 Route active</span>
                        ) : isPending ? (
                          <button onClick={e => { e.stopPropagation(); handleStartRoute() }} style={{
                            backgroundColor: cardColor, color: '#000',
                            border: 'none', borderRadius: '8px', padding: '5px 14px',
                            fontSize: '12px', fontWeight: '800', cursor: 'pointer', fontFamily: 'IBM Plex Sans,sans-serif'
                          }}>▶ Start Route</button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#0070FF', fontWeight: '500' }}>Select →</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
