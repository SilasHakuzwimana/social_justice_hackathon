// petition.js
document.getElementById('petitionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const target_signatures = document.getElementById('target_signatures').value;

    const response = await fetch('/create-petition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, target_signatures })
    });

    const data = await response.json();
    alert(data.message);
});
