import { useEffect, useState } from "react";
import "./Ad.css";

const BASE_URL = "http://127.0.0.1:8001";


export default function AdView() {
    const [adURL, setAdURL] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function fetchAd() {
            try {
                setLoading(true);
                const res = await fetch(`${BASE_URL}/api/get_ad/`, {
                    method: "GET",
                    headers: { Accept: "application/json" },
                });

                if (!res.ok) {
                    const ad = await res.text();
                    throw new Error(`HTTP ${res.status}: ${ad}`);
                }

                const ad = await res.json();
                if (!cancelled) {
                    setAdURL(`${BASE_URL}${ad.image_url}`);
                    setError(null);
                }
            } catch (err) {
                console.error(err);
                if (!cancelled) {
                    setError(err?.message || "Could not reach server. Is Django running?");
                    setAdURL();
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetchAd();
        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <div >
            {!loading && !error && adURL && adURL.length !== 0 && (
                <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&autoplay=1" className="ad-container">
                    <img src={adURL} alt="Advertisement" className="ad-image" />
                </a>
            )}
        </div>
    );
}