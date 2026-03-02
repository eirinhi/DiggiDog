import { useState } from 'react';
import './AdUploadForm.css';

export default function AdUploadForm() {
    const [fileName, setFileName] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith('image/')) {
                alert('Please select a valid image file');
                setFileName('');
                return;
            }
            setFileName(selectedFile.name);
        }
    };
    const clearFile = () => {
        setFileName('');
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    };
    return (
        <form className="ad-upload-form">
            <h2> Upload Ad</h2>

            <div className="form-group">
                <label htmlFor="ad-file">Select Image *</label>
                <div className="file-input-wrapper">
                    <input
                        id="ad-file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <span className="file-label">
                        {fileName || 'Choose an image...'}
                    </span>
                </div>
            </div>
            {fileName && (
                <div className="file-selected">
                    <p>Selected: <strong>{fileName}</strong></p>
                    <button type="button" className="btn-clear" onClick={clearFile}>
                        Clear
                    </button>
                </div>
            )}
        </form>
    );
}

