import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db } from "./firebase.js";


// 🚫 CORS Protection Notice (only on local file://)
if (location.protocol === "file:") {
    alert("⚠️ Cannot run charts from file:// due to CORS. Please use a local server like:\n\npython3 -m http.server 8000\n\nThen open:\nhttp://localhost:8000/smart.html");
    throw new Error("CORS policy blocks Firebase requests over file://. Use http://localhost.");
}

async function fetchNotifications() {
    try {
        console.log("📡 Fetching notifications…");
        const snapshot = await getDocs(collection(db, "notifications"));
        console.log("🔍 Documents returned for notifications:", snapshot.size);

        const notifications = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(" • notification doc:", doc.id, data);
            notifications.push(data);
        });

        return notifications;
    } catch (e) {
        console.error("❌ Firestore fetch failed for notifications:", e);
        return [];
    }
}

async function renderNotifications() {
    const notifications = await fetchNotifications();
    const notificationsContainer = document.getElementById("notifications-container");

    // Check if the notifications array is empty
    if (notifications.length === 0) {
        notificationsContainer.innerHTML = "<p>No notifications available.</p>";
        return;
    }

    // Loop through the notifications and render them
    notifications.forEach(notification => {
        const notificationElement = document.createElement("p");

        // Assign a class based on the notification type
        if (notification.type) {
            notificationElement.classList.add(notification.type.toLowerCase().replace(" ", "-")); // For styling based on type
        }

        // Render notification content
        notificationElement.innerHTML = `🔴 ${notification.type || "No Type"} <br> Product: ${notification.product || "Unknown Product"} <br> Stock Level: ${notification.stockLevel || "Unknown"}`;
        notificationsContainer.appendChild(notificationElement);
    });
}

renderNotifications();


// Fetch data for 'Items Moved' chart
async function fetchItemsMovedData() {
    try {
        console.log("📡 Fetching itemsMoved data…");
        const snapshot = await getDocs(collection(db, "charts", "itemsMoved", "data"));
        console.log("🔍 Documents returned for itemsMoved:", snapshot.size);

        const labels = [];
        const values = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            console.log(" • itemsMoved doc:", doc.id, d);
            labels.push(d.date);
            values.push(d.value);
        });
        return { labels, values };
    } catch (e) {
        console.error("❌ Firestore fetch failed for itemsMoved:", e);
        return { labels: [], values: [] };
    }
}

// Fetch data for 'Fast Moving Items' doughnut chart
async function fetchFastMovingData() {
    try {
        console.log("📡 Fetching fastMoving data…");
        const snapshot = await getDocs(collection(db, "charts", "fastMoving", "data"));
        console.log("🔍 Documents returned for fastMoving:", snapshot.size);

        const labels = [];
        const values = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            console.log(" • fastMoving doc:", doc.id, d);
            labels.push(d.label);
            values.push(d.value);
        });
        return { labels, values };
    } catch (e) {
        console.error("❌ Firestore fetch failed for fastMoving:", e);
        return { labels: [], values: [] };
    }
}

// Add the function to handle the button click event
function goToLiveStock() {
    window.location.href = "livestock.html"; // Redirect to the Live Stock page
}

// Your existing smart.js code...


// Render bar chart for 'Items Moved'
function renderItemsMovedChart(labels, values) {
    const ctx = document.getElementById("itemsMovedChart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Items Moved",
                data: values,
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                tooltip: { mode: 'index', intersect: false },
                hover: { mode: 'nearest', intersect: true }
            }
        }
    });
}

// Render doughnut chart for 'Fast Moving Items'
function renderFastMovingChart(labels, values) {
    const fastMovingCtx = document.getElementById("fastMovingChart").getContext("2d");
    new Chart(fastMovingCtx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fast Moving Items',
                data: values,
                backgroundColor: ['#1abc9c', '#3498db']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'white',
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

// Initialize both charts
async function initializeCharts() {
    const { labels: movedLabels, values: movedValues } = await fetchItemsMovedData();
    renderItemsMovedChart(movedLabels, movedValues);

    const { labels: fastLabels, values: fastValues } = await fetchFastMovingData();
    renderFastMovingChart(fastLabels, fastValues);
}

// 🔄 Fetch and render dynamic boxes for products (left-side grid)
async function fetchProductBoxes() {
    try {
        console.log("📦 Fetching product boxes…");
        const snapshot = await getDocs(collection(db, "products"));
        console.log("🔍 Products returned:", snapshot.size);

        const boxGrid = document.querySelector("#product-list");
        boxGrid.innerHTML = ""; // Clear existing boxes

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(" • product doc:", doc.id, data);

            const box = document.createElement("div");
            box.className = "box";

            // Adjusted to match the structure of the data you're uploading (tag, product, weight, timestamp)
            box.innerHTML = `
                <div class="box-top">${data.product || "Unnamed"}</div>
                <div class="box-bottom">
                    <span>Weight: ${data.weight ?? "?"} grams</span>
                </div>
            `;

            boxGrid.appendChild(box);
        });
    } catch (e) {
        console.error("❌ Firestore fetch failed for product boxes:", e);
    }
}


// 🟢 Load product boxes when page loads
fetchProductBoxes();


initializeCharts();