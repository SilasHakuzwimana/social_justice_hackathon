document.getElementById('resourceForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData(this);
  console.log(`The submitted data are: ${formData}`);

  try {
    document.getElementById('saving').textContent = 'Saving...';
    const response = await fetch('/save-resource', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    document.getElementById('saving').textContent = '';
    
    if (response.ok) {
      document.getElementById('responseMessage').textContent = result.message;
    } else {
      document.getElementById('responseMessage').textContent = result.error || 'An error occurred.';
    }
  } catch (error) {
    document.getElementById('responseMessage').textContent = 'An error occurred while saving the resource.';
    console.error(error);
  }
});
