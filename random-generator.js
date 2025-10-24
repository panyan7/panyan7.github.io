class RandomGenerator {
    constructor() {
        this.randomItems = {
            concepts: [
                'Post-modernism', 'Magical Realism', 'Stream of Consciousness',
                'New Topographics', 'New Color Photography', 'Undecidability',
                'Surrealist Poetry', 'Existentialism'
            ],
            creators: [
                'Roberto Bolaño', 'Jorge Luis Borges', 'Thomas Pynchon',
                'Joel Meyerowitz', 'Stephen Shore', 'David Lynch',
                'Rinko Kawauchi', 'Wong Kar-Wai'
            ],
            works: [
                'One Hundred Years of Solitude', 'Gravity\'s Rainbow',
                'Conversations in the Cathedral', 'Pedro Páramo',
                'A Shimmer of Possibility', 'Uncommon Places',
                'Mulholland Drive', 'Pulp Fiction', 'The Matrix'
            ]
        };
        this.init();
    }

    init() {
        // Generate initial random items
        this.generateRandomItems();

        // Add event listener for the button
        const generateButton = document.getElementById('generate-random');
        if (generateButton) {
            generateButton.addEventListener('click', () => {
                this.generateRandomItems();
            });
        }
    }

    generateRandomItems() {
        const randomConcept = this.randomItems.concepts[Math.floor(Math.random() * this.randomItems.concepts.length)];
        const randomCreator = this.randomItems.creators[Math.floor(Math.random() * this.randomItems.creators.length)];
        const randomWork = this.randomItems.works[Math.floor(Math.random() * this.randomItems.works.length)];

        // Update the display
        const conceptElement = document.getElementById('random-concept');
        const creatorElement = document.getElementById('random-creator');
        const workElement = document.getElementById('random-work');

        if (conceptElement) conceptElement.textContent = randomConcept;
        if (creatorElement) creatorElement.textContent = randomCreator;
        if (workElement) workElement.textContent = randomWork;

        // Animate the button
        const generateButton = document.getElementById('generate-random');
        if (generateButton) {
            generateButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                generateButton.style.transform = 'scale(1)';
            }, 150);
        }
    }
}

// Initialize random generator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on about page
    if (window.location.pathname.includes('about.html')) {
        new RandomGenerator();
    }
});
