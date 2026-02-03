const noBtn = document.getElementById('noBtn');
const yesBtn = document.getElementById('yesBtn');
const catEmoji = document.getElementById('catEmoji');
const buttonsContainer = document.querySelector('.buttons-container');
const card = document.querySelector('.card');

// Configurable tear positions (adjust these to match cat's eyes)
// Values are percentages from left edge of cat emoji
const TEAR_POSITIONS = {
    leftEye: 35,   // Adjust this to match left eye position (horizontal)
    rightEye: 58,  // Adjust this to match right eye position (horizontal)
    verticalOffset: 62  // Adjust this to move tears down from top (percentage from top)
};

let noBtnPosition = { x: 0, y: 0 };
let animationFrameId = null;
let yesBtnInflated = false;
let noBtnDeflated = false;
let lastMoveTime = 0;
const moveCooldown = 50; // milliseconds between moves

// Create tears container for cat emoji
const tearsContainer = document.createElement('div');
tearsContainer.className = 'tears-container';
catEmoji.appendChild(tearsContainer);

let tearInterval = null;

// Function to create a tear at specified position
function createTear(positionPercent) {
    const tear = document.createElement('div');
    tear.className = 'tear';
    tear.style.left = `${positionPercent}%`;
    tear.style.top = `${TEAR_POSITIONS.verticalOffset}%`;
    tearsContainer.appendChild(tear);
    
    // Remove tear after animation
    setTimeout(() => {
        if (tear.parentNode) {
            tear.remove();
        }
    }, 2500);
}

// Make yes button stay inflated after first hover and show tears from cat
yesBtn.addEventListener('mouseenter', () => {
    if (!yesBtnInflated) {
        yesBtn.classList.add('inflated');
        yesBtnInflated = true;
    }
    
    // Start creating tears from both eyes
    tearInterval = setInterval(() => {
        createTear(TEAR_POSITIONS.leftEye);
        createTear(TEAR_POSITIONS.rightEye);
    }, 500); // Create tears every 300ms (slower)
});

// Stop tears when mouse leaves
yesBtn.addEventListener('mouseleave', () => {
    if (tearInterval) {
        clearInterval(tearInterval);
        tearInterval = null;
    }
    // Remove all tears
    const tears = tearsContainer.querySelectorAll('.tear');
    tears.forEach(tear => tear.remove());
});

// Make no button stay deflated after first hover
noBtn.addEventListener('mouseenter', () => {
    if (!noBtnDeflated) {
        noBtn.classList.add('deflated');
        noBtnDeflated = true;
        // Update transform to include scale
        const scale = 0.7;
        noBtn.style.transform = `translate(${noBtnPosition.x}px, ${noBtnPosition.y}px) scale(${scale})`;
    }
});

// Handle yes button click
yesBtn.addEventListener('click', () => {
    // Hide buttons and shy text
    buttonsContainer.classList.add('hidden');
    document.querySelector('.shy-text').classList.add('hidden');
    
    // Show success message
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.remove('hidden');
});

// Track mouse movement with smooth incremental steps
document.addEventListener('mousemove', (e) => {
    const currentTime = Date.now();
    
    // Throttle movement to prevent vibration
    if (currentTime - lastMoveTime < moveCooldown) {
        return;
    }
    
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    animationFrameId = requestAnimationFrame(() => {
        const containerRect = buttonsContainer.getBoundingClientRect();
        const btnRect = noBtn.getBoundingClientRect();
        const yesBtnRect = yesBtn.getBoundingClientRect();
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(mouseX - btnCenterX, 2) + Math.pow(mouseY - btnCenterY, 2)
        );
        
        // If mouse is within 120px of button, move it away
        if (distance < 120) {
            lastMoveTime = currentTime;
            
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;
            const btnWidth = btnRect.width;
            const btnHeight = btnRect.height;
            const containerCenterX = containerWidth / 2;
            
            // Get yes button boundaries
            const yesBtnRightEdge = yesBtnRect.right - containerRect.left;
            const yesBtnLeftEdge = yesBtnRect.left - containerRect.left;
            const gap = 20;
            
            // Calculate safe zone (right of yes button)
            const minAllowedLeftEdge = yesBtnRightEdge + gap;
            const minAllowedCenterX = minAllowedLeftEdge + (btnWidth / 2);
            const minAllowedX = minAllowedCenterX - containerCenterX;
            
            // Calculate bounds
            const maxX = (containerWidth - btnWidth) / 2;
            const maxY = containerHeight - btnHeight;
            const minX = -(containerWidth - btnWidth) / 2;
            const minY = 0;
            const effectiveMinX = Math.max(minX, minAllowedX);
            
            // Calculate current button position in container coordinates
            const currentBtnCenterX = containerCenterX + noBtnPosition.x;
            const currentBtnLeftEdge = currentBtnCenterX - (btnWidth / 2);
            
            // Determine movement: prefer moving right, avoid yes button area
            let newX = noBtnPosition.x;
            let newY = noBtnPosition.y;
            
            // Calculate distance to right edge
            const distanceToRightEdge = maxX - noBtnPosition.x;
            const threshold = maxX * 0.75; // 75% threshold for teleport
            
            // If close to right edge (past threshold), teleport to left at same Y level
            if (noBtnPosition.x > threshold) {
                // Teleport to left side (just after yes button) at same Y level
                newX = effectiveMinX;
                newY = noBtnPosition.y; // Keep same horizontal level
            } else {
                // Normal movement: move right and slightly away from mouse vertically
                const strideDistance = 30;
                
                // Move right (away from yes button area)
                newX = noBtnPosition.x + strideDistance;
                
                // Slight vertical movement away from mouse
                if (mouseY < btnCenterY) {
                    newY = noBtnPosition.y + 15;
                } else if (mouseY > btnCenterY) {
                    newY = noBtnPosition.y - 15;
                }
            }
            
            // Ensure we don't overlap yes button area
            if (newX < effectiveMinX) {
                newX = effectiveMinX;
            }
            
            // Clamp to bounds
            newX = Math.max(effectiveMinX, Math.min(newX, maxX));
            newY = Math.max(minY, Math.min(newY, maxY));
            
            noBtnPosition.x = newX;
            noBtnPosition.y = newY;
            
            // Apply transform with scale if deflated
            const scale = noBtnDeflated ? 0.7 : 1;
            noBtn.style.transform = `translate(${newX}px, ${newY}px) scale(${scale})`;
        }
    });
});

// Reset button position on window resize
window.addEventListener('resize', () => {
    noBtn.style.transform = 'translate(0, 0)';
    noBtnPosition = { x: 0, y: 0 };
});

