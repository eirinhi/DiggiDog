import{useState} from 'react';

export default function CreateCompetitionForm(){
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [maxParticipants, setMaxParticipants] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (start < now) {
            setError('Start date can not be in the past.');
            setLoading(false);
            return;
        }

        if (end <= start) {
            setError('End date must be after start date.');
            setLoading(false);
            return;
        }


        try {
            const reponse = await fetch('http://localhost:8000/api/create_comp/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    start_date: startDate,
                    end_date: endDate,
                    max_participants: Number(maxParticipants),
                    user_id: 1,
                }),
            });

            if (!reponse.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Something went wrong');
            }

            setSuccess('Competition created!');
            setName('');
            setDescription('');
            setStartDate('');
            setEndDate('');
            setMaxParticipants('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading (false);
        }
    };

    return (
        <div className="form-container">
            <h2>Opprett konkurranse</h2>
            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Navn på konkurranse *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Beskrivelse</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                    />
                </div>

                <div className="form-group">
                    <label>Startdato og tid *</label>
                    <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Sluttdato og tid *</label>
                    <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Maks antall deltakere *</label>
                    <input
                        type="number"
                        value={maxParticipants}
                        onChange={(e) => setMaxParticipants(e.target.value)}
                        min="1"
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Oppretter...' : 'Opprett konkurranse'}
                </button>
            </form>
        </div>
    );
}