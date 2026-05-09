
import { audioBridge } from './ffi.ts';
declare global {
    audioBridge: typeof audioBridge
}
