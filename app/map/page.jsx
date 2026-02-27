'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'

// Mock Data for MVP Campus Map
const MAP_LOCATIONS = [
    { id: 'dreese', name: 'Dreese Labs (3rd Floor)', type: 'Academic', noiseLevel: 'Low', occupancy: '15%', safeSpace: true },
    { id: 'thompson', name: 'Thompson Lib (11th Fl)', type: 'Library', noiseLevel: 'Silent', occupancy: '40%', safeSpace: true },
    { id: 'thompson-ground', name: 'Thompson Lib (Ground)', type: 'Library', noiseLevel: 'High', occupancy: '90%', safeSpace: false },
    { id: 'union', name: 'Student Union Lounge', type: 'Social', noiseLevel: 'Overwhelming', occupancy: '98%', safeSpace: false },
    { id: 'rpac', name: 'RPAC Cafe', type: 'Recreation', noiseLevel: 'Moderate', occupancy: '60%', safeSpace: false },
    { id: '18th', name: '18th Ave Lib (Basement)', type: 'Library', noiseLevel: 'Silent', occupancy: '35%', safeSpace: true },
    { id: 'younkin', name: 'Younkin Success Center', type: 'Support', noiseLevel: 'Low', occupancy: '25%', safeSpace: true },
    { id: 'knowlton', name: 'Knowlton Hall (Roof Garden)', type: 'Outdoor', noiseLevel: 'Silent', occupancy: '10%', safeSpace: true },
    { id: 'pomerene', name: 'Pomerene Hall Atrium', type: 'Academic', noiseLevel: 'Moderate', occupancy: '45%', safeSpace: false },
    { id: 'scott', name: 'Scott Dining Hall', type: 'Dining', noiseLevel: 'High', occupancy: '85%', safeSpace: false }
]

export default function CampusMapPage() {
    const [locations, setLocations] = useState(MAP_LOCATIONS)
    const [filter, setFilter] = useState('all')

    const toggleSafeSpace = (id) => {
        setLocations(locs => locs.map(loc =>
            loc.id === id ? { ...loc, safeSpace: !loc.safeSpace } : loc
        ))
    }

    const getNoiseColor = (level) => {
        switch (level.toLowerCase()) {
            case 'silent': return '#198038' // Green
            case 'low': return '#0F62FE' // Blue
            case 'moderate': return '#F1C21B' // Yellow
            case 'high': return '#FF832B' // Orange
            case 'overwhelming': return '#DA1E28' // Red
            default: return '#525252'
        }
    }

    const filteredLocations = filter === 'safe'
        ? locations.filter(loc => loc.safeSpace)
        : locations

    return (
        <>
            <Navbar />
            <div style={{
                paddingTop: '64px', paddingBottom: '48px', fontFamily: 'IBM Plex Sans, sans-serif',
                minHeight: '100vh', backgroundColor: '#F4F4F4'
            }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>

                    <div style={{ marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#161616', marginBottom: '8px' }}>
                            Sensory Campus Map
                        </h1>
                        <p style={{ color: '#525252', fontSize: '15px', lineHeight: 1.6, maxWidth: '600px' }}>
                            Real-time sensory tracking across campus. Based on public class schedules and student-contributed check-ins. <strong style={{ color: '#0F62FE' }}>Phase 2 will introduce live Wi-Fi density integration.</strong>
                        </p>
                    </div>

                    {/* Time Context Banner */}
                    <div style={{
                        backgroundColor: '#E5F6FF',
                        border: '1px solid #BAE6FF',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#0043CE',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        <span style={{ fontSize: '18px' }}>🕒</span>
                        Currently viewing estimated occupancy for: <strong>Tuesday, 2:15 PM</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <button
                            onClick={() => setFilter('all')}
                            style={{
                                backgroundColor: filter === 'all' ? '#161616' : '#E0E0E0',
                                color: filter === 'all' ? '#FFFFFF' : '#161616',
                                border: 'none', borderRadius: '20px', padding: '8px 20px',
                                fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms'
                            }}>
                            All Locations
                        </button>
                        <button
                            onClick={() => setFilter('safe')}
                            style={{
                                backgroundColor: filter === 'safe' ? '#198038' : '#E0E0E0',
                                color: filter === 'safe' ? '#FFFFFF' : '#161616',
                                border: 'none', borderRadius: '20px', padding: '8px 20px',
                                fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 200ms'
                            }}>
                            Safe Space Registry
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredLocations.map(loc => (
                            <div key={loc.id} style={{
                                backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '20px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center',
                                borderLeft: loc.safeSpace ? '4px solid #198038' : '4px solid transparent'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#161616' }}>{loc.name}</h2>
                                        {loc.safeSpace && (
                                            <span style={{
                                                backgroundColor: '#DEFBE6', color: '#198038', fontSize: '11px',
                                                fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px'
                                            }}>Verified Quiet</span>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '16px', color: '#525252', fontSize: '14px' }}>
                                        <span>Building: {loc.type}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            Noise:
                                            <span style={{
                                                display: 'inline-block', width: '8px', height: '8px',
                                                borderRadius: '50%', backgroundColor: getNoiseColor(loc.noiseLevel)
                                            }} />
                                            {loc.noiseLevel}
                                        </span>
                                        <span>Est. Occupancy: <strong>{loc.occupancy}</strong></span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleSafeSpace(loc.id)}
                                    style={{
                                        backgroundColor: loc.safeSpace ? '#FFFFFF' : '#F4F4F4',
                                        color: loc.safeSpace ? '#DA1E28' : '#0F62FE',
                                        border: loc.safeSpace ? '1px solid #DA1E28' : '1px solid transparent',
                                        borderRadius: '4px', padding: '8px 16px', fontSize: '13px',
                                        fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
                                    }}>
                                    {loc.safeSpace ? 'Remove from Registry' : 'Mark as Safe Space'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {filteredLocations.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#525252' }}>
                            No locations match this filter.
                        </div>
                    )}

                </div>
            </div>
        </>
    )
}
