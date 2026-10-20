import type { Call } from '@telnyx/webrtc';
import type { ICallOptions } from '@/atoms/callOptions';

/** Options accepted by `call.answer()` (`AnswerParams` is not exported by the SDK). */
export type AnswerOptions = NonNullable<Parameters<Call['answer']>[0]>;

/**
 * Select value meaning "let the SDK pick". Radix Select rejects an empty string
 * and Chrome uses the literal id `default` for the system default device, so
 * the sentinel has to be something no browser will ever hand out.
 */
export const SDK_DEFAULT_DEVICE = '__sdk_default__';

export const toDeviceId = (value: string | undefined): string | undefined =>
  value && value !== SDK_DEFAULT_DEVICE ? value : undefined;

export const toSelectValue = (deviceId: string | undefined): string =>
  deviceId || SDK_DEFAULT_DEVICE;

/**
 * Per-call options to pass to `call.answer()`.
 *
 * @telnyx/webrtc 2.28.0 made `answer()` accept the same device options as
 * `newCall()` (`micId`, `speakerId`, `camId`, ...). Only set keys are copied so
 * an unset device keeps the call's inherited default instead of overriding it
 * with `undefined`.
 */
export const getAnswerOptions = (options: ICallOptions): AnswerOptions => {
  const answerOptions: AnswerOptions = {};

  if (options.micId) {
    answerOptions.micId = options.micId;
  }
  if (options.speakerId) {
    answerOptions.speakerId = options.speakerId;
  }
  if (options.camId) {
    answerOptions.camId = options.camId;
  }
  if (options.customHeaders?.length) {
    answerOptions.customHeaders = options.customHeaders;
  }

  return answerOptions;
};
