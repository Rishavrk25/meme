import { useState } from 'react';
import './App.css';

const memeTemplates = [
    { id: '181913649', name: 'Drake Hotline Bling' },
    { id: '87743020', name: 'Two Buttons' },
    { id: '112126428', name: 'Distracted Boyfriend' },
    { id: '129242436', name: 'Change My Mind' },
    { id: '124822590', name: 'Left Exit 12 Off Ramp' },
    { id: '217743513', name: 'UNO Draw 25 Cards' },
    { id: '131087935', name: 'Running Away Balloon' },
    { id: '247375501', name: 'Buff Doge vs. Cheems' },
    { id: '222403160', name: 'Bernie I Am Once Again Asking' },
    { id: '4087833', name: 'Waiting Skeleton' }
];

function App() {
    const [prompt, setPrompt] = useState('');
    const [templateId, setTemplateId] = useState(memeTemplates[0].id);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [memeUrl, setMemeUrl] = useState('');

    const generateMeme = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            setTimeout(() => setError(''), 3000);
            return;
        }

        setLoading(true);
        setError('');
        setMemeUrl('');

        try {
            const templateName = memeTemplates.find(t => t.id === templateId)?.name || '';

            const response = await fetch('http://localhost:5001/api/generate-meme', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt, templateId, templateName })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to generate meme');
            }

            const data = await response.json();
            if (data.success && data.url) {
                setMemeUrl(data.url);
            } else {
                throw new Error('No image URL returned');
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const downloadImage = () => {
        if (!memeUrl) return;
        const link = document.createElement('a');
        link.href = memeUrl;
        link.download = 'my-meme.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const shareImage = () => {
        if (!memeUrl) return;
        if (navigator.share) {
            navigator.share({
                title: 'Check out my meme!',
                text: 'I created this meme using the AI Meme Generator',
                url: memeUrl
            }).catch(error => console.log('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(memeUrl)
                .then(() => alert('Meme URL copied to clipboard!'))
                .catch(err => console.error('Failed to copy URL:', err));
        }
    };

    return (
        <div className="container">
            <header>
                <h1>AI Meme Generator</h1>
                <p>Enter a prompt and get a hilarious meme!</p>
            </header>
            
            <main>
                <div className="input-section">
                    <form id="meme-form" onSubmit={generateMeme}>
                        <div className="form-group">
                            <label htmlFor="template-select">Meme Template:</label>
                            <select 
                                id="template-select" 
                                className="form-control"
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                            >
                                {memeTemplates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="prompt">Your Prompt:</label>
                            <input 
                                type="text" 
                                id="prompt" 
                                placeholder="Enter something funny..." 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                required 
                            />
                        </div>
                        <button type="submit" id="generate-btn" disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Meme'}
                        </button>
                    </form>
                </div>
                
                <div className="output-section">
                    {loading && (
                        <div id="loading">
                            <div className="loading-spinner"></div>
                            <p className="fade-in">Creating your meme masterpiece...</p>
                            <p className="slide-up">This will only take a moment</p>
                        </div>
                    )}

                    {error && (
                        <div id="error-message" className="shake">
                            {error}
                        </div>
                    )}

                    {memeUrl && !loading && (
                        <div id="meme-container" className="grid-container">
                            <div className="image-wrapper pop">
                                <img src={memeUrl} alt="Generated Meme" className="meme-img fade-in" />
                                <div className="image-actions slide-up">
                                    <button onClick={downloadImage} className="image-action-btn pulse">
                                        <i className="fas fa-download"></i> Download
                                    </button>
                                    <button onClick={shareImage} className="image-action-btn pulse">
                                        <i className="fas fa-share-alt"></i> Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && !error && !memeUrl && (
                        <div className="placeholder-state">
                            <div className="placeholder-icon">🎭</div>
                            <p className="placeholder-title">Your meme will appear here</p>
                            <p className="placeholder-subtitle">Choose a template, enter a prompt, and hit Generate!</p>
                        </div>
                    )}
                </div>
            </main>
            
            <footer>
                <p>Created with ❤️ | Using meme APIs</p>
            </footer>
        </div>
    );
}

export default App;
