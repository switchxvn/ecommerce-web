import { randomInt } from 'crypto';

const RANDOM_DIGITS = 6;

function generateRandomDigits(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += randomInt(0, 10).toString();
  }
  return result;
}

export function generateOrderCode(): string {
  const timestamp = Date.now();
  const randomNum = generateRandomDigits(RANDOM_DIGITS);
  
  // Combine timestamp with random numbers, but ensure it's not longer than 16 digits
  // to stay within MAX_SAFE_INTEGER (which is 9007199254740991)
  const orderCode = `${timestamp}${randomNum}`.slice(0, 16);
  
  return orderCode;
} 
