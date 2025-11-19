document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // small helper to avoid injection when rendering names
      const escapeHtml = (str) =>
        String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // build participants HTML: show avatar initials + name, or fallback
        const participantsListHTML =
          details.participants && details.participants.length
            ? details.participants
                .map((p) => {
                  const initials = String(p)
                    .split(" ")
                    .map((s) => s[0] || "")
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return `<li><span class="avatar">${escapeHtml(initials)}</span><span class="participant-name">${escapeHtml(
                    p
                  )}</span><span class="delete-participant" title="Remove participant" data-activity="${escapeHtml(name)}" data-participant="${escapeHtml(p)}">&#128465;</span></li>`;
                })
                .join("")
            : '<li class="no-participants">No participants yet</li>';

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Participants:</strong></p>
          <ul class="participants-list">
            ${participantsListHTML}
          </ul>
        `;


        activitiesList.appendChild(activityCard);

        // Add delete icon event listeners for this card
        const deleteIcons = activityCard.querySelectorAll('.delete-participant');
        deleteIcons.forEach((icon) => {
          icon.addEventListener('click', async (e) => {
            const activityName = icon.getAttribute('data-activity');
            const participant = icon.getAttribute('data-participant');
            if (!activityName || !participant) return;
            if (!confirm(`Remove ${participant} from ${activityName}?`)) return;
            try {
              const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(participant)}`, { method: 'DELETE' });
              if (response.ok) {
                fetchActivities();
              } else {
                alert('Failed to remove participant.');
              }
            } catch (err) {
              alert('Error removing participant.');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
