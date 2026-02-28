/**
 * app/api/ui-config/route.js
 * Proxies the student's CAP profile to the Python ML prediction server
 * and returns the optimal UI configuration.
 */

export async function POST(request) {
    try {
        const { capProfile } = await request.json()

        const res = await fetch('http://localhost:5001/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cap_profile: capProfile }),
        })

        if (!res.ok) throw new Error(`ML server error: ${res.status}`)
        const data = await res.json()
        return Response.json(data)

    } catch (err) {
        // Fallback: return safe defaults so the UI never breaks
        return Response.json({
            ui_config: {
                color_theme: 'neutral',
                font_family: 'inter',
                font_size: 'default',
                motion: 'reduced',
                info_density: 'moderate',
                large_targets: false,
                read_aloud: false,
                progress_bars: true,
                no_timers: false,
            },
            fallback: true,
            error: err.message,
        })
    }
}
