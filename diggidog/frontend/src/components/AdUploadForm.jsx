import { useState } from 'react';
import './AdUploadForm.css';

const BASE_URL = "http://127.0.0.1:8001";

export default function AdUploadForm() {
    const [fileName, setFileName] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select a valid image file');
                setFileName('');
                setSelectedFile(null);
                return;
            }
            setFileName(file.name);
            setSelectedFile(file);
            setError(null);
            setSuccess(false);
        }
    };

    const clearFile = () => {
        setFileName('');
        setSelectedFile(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedFile) {
            setError('Please select a file to upload');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            const formData = new FormData();
            formData.append('myfile', selectedFile);

            const res = await fetch(`${BASE_URL}/api/upload_ad/`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            setSuccess(true);
            setError(null);
            
            setTimeout(() => {
                clearFile();
                setSuccess(false);
            }, 3000);

        } catch (err) {
            console.error(err);
            setError(err?.message || "Could not reach server. Is Django running?");
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };
    return (
        <form className="ad-upload-form" onSubmit={handleSubmit}>
            <h2>Upload Ad</h2>

            {error && (
                <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
                    {error}
                </div>
            )}

            {success && (
                <div className="success-message" style={{ color: 'green', marginBottom: '1rem' }}>
                    Image uploaded successfully!
                </div>
            )}

            <div className="form-group">
                <label htmlFor="ad-file">Select Image *</label>
                <div className="file-input-wrapper">
                    <input
                        id="ad-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={loading}
                    />
                    <span className="file-label">
                        {fileName || 'Choose an image...'}
                    </span>
                </div>
            </div>

            {fileName && (
                <div className="file-selected">
                    <p>Selected: <strong>{fileName}</strong></p>
                    <button 
                        type="button" 
                        className="btn-clear" 
                        onClick={clearFile}
                        disabled={loading}
                    >
                        Clear
                    </button>
                </div>
            )}

            <button 
                type="submit" 
                className="btn-submit"
                disabled={loading || !selectedFile}
            >
                {loading ? 'Uploading...' : 'Upload Ad'}
            </button>
        </form>
    );
}

