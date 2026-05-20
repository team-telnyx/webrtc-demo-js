import { LocalStreamReproController } from './localStreamRepro';

/**
 * Global ref for the active repro controller.
 *
 * The Dialer creates the controller and stores it here.
 * The CallNotificationHandler reads it to trigger onCallActive().
 * The ActiveCall component reads it for status display + manual controls.
 */
let active: LocalStreamReproController | null = null;

export function setActiveReproController(
  controller: LocalStreamReproController | null,
) {
  active = controller;
}

export function getActiveReproController(): LocalStreamReproController | null {
  return active;
}
