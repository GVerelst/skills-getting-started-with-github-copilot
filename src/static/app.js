document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function removeParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  }

  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const spotsLeft = Math.max(details.max_participants - details.participants.length, 0);
    const participants = details.participants || [];
    const participantItems = participants.length
      ? participants
          .map(
            (email) => `
              <li class="participant-item">
                <span class="participant-email">${email}</span>
                <button
                  type="button"
                  class="participant-remove"
                  data-activity="${name}"
                  data-email="${email}"
                  aria-label="Remove ${email}"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            `
          )
          .join("")
      : '<li class="empty-state">No participants yet</li>';

    activityCard.innerHTML = `
      <div class="activity-card__header">
        <h4>${name}</h4>
        <span class="activity-chip">${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left</span>
      </div>
      <p class="activity-description">${details.description}</p>
      <p class="activity-schedule"><strong>Schedule:</strong> ${details.schedule}</p>
      <div class="participants-section">
        <h5>Participants</h5>
        <ul class="participants-list">${participantItems}</ul>
      </div>
    `;

    activityCard.querySelectorAll(".participant-remove").forEach((button) => {
      button.addEventListener("click", () => {
        removeParticipant(button.dataset.activity, button.dataset.email);
      });
    });

    return activityCard;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message and reset select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        activitiesList.appendChild(renderActivityCard(name, details));

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
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
