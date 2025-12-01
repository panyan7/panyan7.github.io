class RandomGenerator {
    constructor() {
        this.randomItems = {
            concepts: [
                'Postmodernism', 'Magical Realism', 'Stream of Consciousness',
                'Latin American Literature', 'Existentialism', 'Romanticism',
                'New Topographics', 'Undecidability', 'Randomness',
            ],
            creators: [
                'Roberto Bolaño', 'Jorge Luis Borges', 'Thomas Pynchon',
                'Joel Meyerowitz', 'Stephen Shore', 'Rinko Kawauchi',
                'David Lynch', 'Wong Kar-Wai', 'Ang Lee'
            ],
            works: [
                'One Hundred Years of Solitude', 'Pedro Páramo', 'The Aleph',
                'Gravity\'s Rainbow', 'The Savage Detectives', '2666',
                'A Shimmer of Possibility', 'Uncommon Places',
                'Mulholland Drive', 'Pulp Fiction', 'The Matrix'
            ],
            quotes: [
                // { text: 'The universe (which others call the Library) is composed of an indefinite, perhaps infinite number of hexagonal galleries.', author: 'Jorge Luis Borges, The Library of Babel' },
                // { text: 'I saw the coupling of love and the modification of death...', author: 'Jorge Luis Borges, The Aleph' },
                { text: '<img src="../files/img/the_savage_detectives_poem.png" alt="The Savage Detectives" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">', author: 'Sión, a poem by Cesárea Tinajero' },
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
        const randomQuote = this.randomItems.quotes[Math.floor(Math.random() * this.randomItems.quotes.length)];

        // Update the display
        const conceptElement = document.getElementById('random-concept');
        const creatorElement = document.getElementById('random-creator');
        const workElement = document.getElementById('random-work');
        const quoteElement = document.getElementById('random-quote');
        const quoteAuthorElement = document.getElementById('random-quote-author');

        if (conceptElement) conceptElement.textContent = randomConcept;
        if (creatorElement) creatorElement.textContent = randomCreator;
        if (workElement) workElement.textContent = randomWork;
        if (quoteElement) quoteElement.innerHTML = randomQuote.text;
        if (quoteAuthorElement) quoteAuthorElement.textContent = randomQuote.author;

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
