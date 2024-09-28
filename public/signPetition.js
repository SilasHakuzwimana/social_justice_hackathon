// signPetition.js
document.getElementById('signPetitionBtn').addEventListener('click', async () => {
    const petitionId = 1; // Get the petition ID dynamically
    const userId = 1; // Get the logged-in user ID

    const response = await fetch('/sign-petition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, petition_id: petitionId })
    });

    const data = await response.json();
    if (response.ok) {
        alert('Petition signed!');
        document.getElementById('progressBar').textContent = `${data.signatures} signatures so far!`;
    } else {
        alert(data.message);
    }
});
