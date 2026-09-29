const { animate, stagger } = anime;

// Slide the title in from the left
animate('.title', {
  x: [-200, 0],
  opacity: [0, 1],
  duration: 800,
  ease: 'outExpo',
});

// Cards pop in one after another
animate('.card', {
  y: [40, 0],
  opacity: [0, 1],
  delay: stagger(150),
});