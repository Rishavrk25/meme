// Import the configuration file
import config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const memeForm = document.getElementById('meme-form');
    const promptInput = document.getElementById('prompt');
    const generateBtn = document.getElementById('generate-btn');
    const loadingElement = document.getElementById('loading');
    const memeContainer = document.getElementById('meme-container');
    const errorMessage = document.getElementById('error-message');
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    
    // Gemini API configuration
    const GEMINI_API_KEY = config.geminiApiKey;
    
    // Imgflip popular meme templates
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
    
    // Add template selection dropdown to the form
    const formGroup = document.querySelector('.form-group');
    const templateSelectDiv = document.createElement('div');
    templateSelectDiv.classList.add('form-group');
    
    const templateLabel = document.createElement('label');
    templateLabel.setAttribute('for', 'template-select');
    templateLabel.textContent = 'Meme Template:';
    
    const templateSelect = document.createElement('select');
    templateSelect.id = 'template-select';
    templateSelect.classList.add('form-control');
    
    // Add options to select
    memeTemplates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        templateSelect.appendChild(option);
    });
    
    templateSelectDiv.appendChild(templateLabel);
    templateSelectDiv.appendChild(templateSelect);
    
    // Insert template selection before the prompt input
    formGroup.parentNode.insertBefore(templateSelectDiv, formGroup);

    // Event Listeners
    memeForm.addEventListener('submit', generateMeme);

    // Function to call Gemini API to generate meme text based on user prompt
    async function generateMemeTextWithGemini(prompt, template) {
        try {
            if (!GEMINI_API_KEY || GEMINI_API_KEY === 'AIzaSyAMiRruLkEj4RWM_i6lchoc7jLzqE2OINc') {
                throw new Error('Please add your Gemini API key in the config.js file');
            }
            
            // Update loading message
            loadingElement.textContent = 'Generating creative meme text with AI...';
            
            // Prepare the request to Gemini API
            const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `Create a funny meme text for a "${template}" meme template based on this prompt: "${prompt}". 
                        The text should be witty, concise, and suitable for a meme. 
                        For a two-panel meme template, provide text for both panels separated by | character. 
                        For a single panel meme, just provide the text. 
                        Keep it under 100 characters total. Don't include any explanations, just the meme text.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 100
                }
            };
            
            const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to generate text with Gemini API');
            }
            
            const data = await response.json();
            
            // Extract the generated text from Gemini's response
            const generatedText = data.candidates[0].content.parts[0].text.trim();
            
            // Split the text if it contains the separator for two-panel memes
            const textParts = generatedText.split('|').map(part => part.trim());
            
            return {
                topText: textParts[0],
                bottomText: textParts.length > 1 ? textParts[1] : ''
            };
            
        } catch (error) {
            console.error('Error generating text with Gemini:', error);
            throw error;
        }
    }
    
    // Generate Meme Function
    async function generateMeme(e) {
        e.preventDefault();
        const prompt = promptInput.value.trim();
        const selectedTemplateId = templateSelect.value;
        const selectedTemplateName = templateSelect.options[templateSelect.selectedIndex].text;
        
        if (!prompt) {
            showError('Please enter a prompt');
            return;
        }

        // Show loading, hide other elements
        showLoading();
        
        // Clear previous images and show loading indicators
        memeContainer.innerHTML = '';
        
        // Create a loading placeholder with animation
        const imageWrapper = document.createElement('div');
        imageWrapper.classList.add('image-wrapper', 'fade-in');
        
        // Create a custom loading spinner instead of using a gif
        const loadingSpinner = document.createElement('div');
        loadingSpinner.classList.add('loading-spinner');
        
        // Add a loading text
        const loadingText = document.createElement('p');
        loadingText.textContent = 'Preparing your meme...';
        loadingText.style.textAlign = 'center';
        loadingText.style.margin = '15px 0';
        loadingText.style.color = '#4a90e2';
        
        imageWrapper.appendChild(loadingSpinner);
        imageWrapper.appendChild(loadingText);
        memeContainer.appendChild(imageWrapper);
        
        try {
            // First, generate meme text using Gemini API
            const memeText = await generateMemeTextWithGemini(prompt, selectedTemplateName);
            
            // Update loading message
            loadingElement.textContent = 'Creating your meme with the generated text...';
            
            // Use Imgflip API to generate meme images with the AI-generated text
            const formData = new FormData();
            formData.append('template_id', selectedTemplateId);
            formData.append('username', 'PranshuChauhan'); // Using public demo credentials
            formData.append('password', '63Pranshu149@'); // Using public demo credentials
            formData.append('text0', memeText.topText); // Top text from Gemini
            formData.append('text1', memeText.bottomText); // Bottom text from Gemini
            
            const response = await fetch('https://api.imgflip.com/caption_image', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to generate meme');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error_message || 'Failed to generate meme');
            }
            
            // Get the image URL from the response
            const imageUrl = data.data.url;
            
            // Clear the loading placeholders
            memeContainer.innerHTML = '';
            
            // Display the generated image with animations
            const imageWrapper = document.createElement('div');
            imageWrapper.classList.add('image-wrapper', 'pop');
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = 'Generated Meme';
            img.classList.add('meme-img');
            img.onload = () => {
                // Add a subtle animation when the image loads
                img.classList.add('fade-in');
            };
            
            // Add download button for the image with animation
            const downloadButton = document.createElement('button');
            downloadButton.textContent = '⬇️ Download';
            downloadButton.classList.add('image-action-btn', 'pulse');
            downloadButton.addEventListener('click', () => {
                downloadButton.classList.add('bounce');
                setTimeout(() => downloadButton.classList.remove('bounce'), 1000);
                downloadImage(imageUrl);
            });
            
            // Add share button for the image with animation
            const shareButton = document.createElement('button');
            shareButton.textContent = '🔗 Share';
            shareButton.classList.add('image-action-btn', 'pulse');
            shareButton.addEventListener('click', () => {
                shareButton.classList.add('bounce');
                setTimeout(() => shareButton.classList.remove('bounce'), 1000);
                shareImage(imageUrl);
            });
            
            const actionDiv = document.createElement('div');
            actionDiv.classList.add('image-actions', 'slide-up');
            actionDiv.appendChild(downloadButton);
            actionDiv.appendChild(shareButton);
            
            imageWrapper.appendChild(img);
            imageWrapper.appendChild(actionDiv);
            memeContainer.appendChild(imageWrapper);
            
            hideLoading();
            memeContainer.classList.remove('hidden');
            
        } catch (error) {
            hideLoading();
            showError(error.message || 'Something went wrong. Please try again.');
        }
    }

    // No longer need the generateBottomText function as we're using DeepAI to generate the entire image

    // Download Image Function
    function downloadImage(imageUrl) {
        if (!imageUrl) return;
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'my-meme.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Share Image Function
    function shareImage(imageUrl) {
        if (!imageUrl) return;
        
        // Check if Web Share API is supported
        if (navigator.share) {
            navigator.share({
                title: 'Check out my meme!',
                text: 'I created this meme using the AI Meme Generator',
                url: imageUrl
            })
            .catch(error => console.log('Error sharing:', error));
        } else {
            // Fallback - copy URL to clipboard
            navigator.clipboard.writeText(imageUrl)
                .then(() => alert('Meme URL copied to clipboard!'))
                .catch(err => console.error('Failed to copy URL:', err));
        }
    }

    // UI Helper Functions with animations
    // Make sure loading element is hidden initially
    loadingElement.classList.add('hidden');
    
    function showLoading() {
        // Clear any previous content and set new loading message
        loadingElement.innerHTML = '<div class="loading-spinner"></div><p class="fade-in">Creating your meme masterpiece...</p><p class="slide-up">This will only take a moment</p>';
        
        // Make loading element visible
        loadingElement.classList.remove('hidden');
        
        // Hide other elements and disable button
        memeContainer.classList.add('hidden');
        errorMessage.classList.add('hidden');
        generateBtn.disabled = true;
    }

    function hideLoading() {
        loadingElement.classList.add('hidden');
        generateBtn.disabled = false;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        errorMessage.classList.add('shake');
        memeContainer.classList.add('hidden');
        
        // Remove the shake animation after it completes
        setTimeout(() => {
            errorMessage.classList.remove('shake');
        }, 500);
    }
});