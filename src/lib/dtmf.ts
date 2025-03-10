export const playDTMFTone = (digit: string) => {
  const audioContext = new (window.AudioContext ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).webkitAudioContext)();

  // DTMF frequencies (low, high) in Hz
  const dtmfFrequencies: Record<string, [number, number]> = {
    "1": [697, 1209],
    "2": [697, 1336],
    "3": [697, 1477],
    "4": [770, 1209],
    "5": [770, 1336],
    "6": [770, 1477],
    "7": [852, 1209],
    "8": [852, 1336],
    "9": [852, 1477],
    "*": [941, 1209],
    "0": [941, 1336],
    "#": [941, 1477],
  };

  if (!dtmfFrequencies[digit]) return;

  const [lowFreq, highFreq] = dtmfFrequencies[digit];
  const duration = 0.15; // tone duration in seconds

  // Create oscillators for the two frequencies
  const lowOsc = audioContext.createOscillator();
  const highOsc = audioContext.createOscillator();

  lowOsc.type = "sine";
  highOsc.type = "sine";
  lowOsc.frequency.value = lowFreq;
  highOsc.frequency.value = highFreq;

  // Create a gain node to control volume
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.2; // Reduce volume to avoid loudness

  // Connect oscillators to gain node and to destination
  lowOsc.connect(gainNode);
  highOsc.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Start and stop the oscillators
  lowOsc.start();
  highOsc.start();

  setTimeout(() => {
    lowOsc.stop();
    highOsc.stop();
    audioContext.close();
  }, duration * 1000);
};
