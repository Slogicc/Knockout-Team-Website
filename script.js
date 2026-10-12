const { createTimeline } = anime;

const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 1000 } });

tl.add('.number', { opacity: [0, 1.00] })
  .add('.name',   { opacity: [0, 1], y: [30, 0] }, '-=600')
  .add('.slogan', { opacity: [0, 1] }, '-=700')
  .add('.topbar', { y: ['-100%', 0] }, '-=400');