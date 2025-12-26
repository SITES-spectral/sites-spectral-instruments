/**
 * @vitest-environment node
 *
 * Promise Utilities Unit Tests
 * Tests for Phase 6.1 - Promise rejection handlers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the module since it's an IIFE that attaches to global
const PromiseUtils = {
    async allSettledValues(promises, options = {}) {
        const { logErrors = true, context = 'Promise' } = options;
        const results = await Promise.allSettled(promises);

        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                if (logErrors) {
                    console.error(`[${context}] Promise ${index} failed:`, result.reason);
                }
                return null;
            }
        });
    },

    async safeAll(promises, options = {}) {
        const { requireAll = false, context = 'Promise' } = options;
        const settled = await Promise.allSettled(promises);

        const results = [];
        const errors = [];

        settled.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                errors.push({
                    index,
                    error: result.reason,
                    message: result.reason?.message || 'Unknown error'
                });
                results.push(null);
            }
        });

        const hasErrors = errors.length > 0;
        const allFailed = errors.length === promises.length;

        if (hasErrors) {
            errors.forEach(err => {
                console.error(`[${context}] Promise ${err.index} failed:`, err.error);
            });
        }

        if (allFailed) {
            throw new Error(`[${context}] All ${promises.length} promises failed`);
        }

        if (requireAll && hasErrors) {
            throw new Error(`[${context}] ${errors.length}/${promises.length} promises failed`);
        }

        return { results, errors, hasErrors, allSucceeded: !hasErrors };
    },

    safe(fn, options = {}) {
        const { defaultValue = null, logError = true, context = fn.name || 'async' } = options;

        return async (...args) => {
            try {
                return await fn(...args);
            } catch (error) {
                if (logError) {
                    console.error(`[${context}] Error:`, error);
                }
                return defaultValue;
            }
        };
    },

    async withTimeout(promise, timeoutMs, message = 'Operation timed out') {
        let timeoutId;

        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(message));
            }, timeoutMs);
        });

        try {
            const result = await Promise.race([promise, timeoutPromise]);
            clearTimeout(timeoutId);
            return result;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    },

    async retry(fn, options = {}) {
        const {
            maxRetries = 3,
            initialDelay = 1000,
            maxDelay = 10000,
            shouldRetry = () => true
        } = options;

        let lastError;
        let delay = initialDelay;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                if (attempt === maxRetries || !shouldRetry(error, attempt)) {
                    throw error;
                }

                await new Promise(resolve => setTimeout(resolve, delay));
                delay = Math.min(delay * 2, maxDelay);
            }
        }

        throw lastError;
    },

    async sequence(promiseFns) {
        const results = [];
        for (const fn of promiseFns) {
            const result = await fn();
            results.push(result);
        }
        return results;
    },

    async pool(promiseFns, concurrency = 5) {
        const results = new Array(promiseFns.length);
        let currentIndex = 0;

        async function worker() {
            while (currentIndex < promiseFns.length) {
                const index = currentIndex++;
                results[index] = await promiseFns[index]();
            }
        }

        const workers = [];
        for (let i = 0; i < Math.min(concurrency, promiseFns.length); i++) {
            workers.push(worker());
        }

        await Promise.all(workers);
        return results;
    }
};

describe('Promise Utilities', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    describe('allSettledValues', () => {
        it('should return values for all successful promises', async () => {
            const promises = [
                Promise.resolve('a'),
                Promise.resolve('b'),
                Promise.resolve('c')
            ];

            const results = await PromiseUtils.allSettledValues(promises);

            expect(results).toEqual(['a', 'b', 'c']);
        });

        it('should return null for failed promises', async () => {
            const promises = [
                Promise.resolve('a'),
                Promise.reject(new Error('failed')),
                Promise.resolve('c')
            ];

            const results = await PromiseUtils.allSettledValues(promises);

            expect(results).toEqual(['a', null, 'c']);
        });

        it('should log errors by default', async () => {
            const promises = [Promise.reject(new Error('test error'))];

            await PromiseUtils.allSettledValues(promises, { context: 'Test' });

            expect(console.error).toHaveBeenCalledWith(
                '[Test] Promise 0 failed:',
                expect.any(Error)
            );
        });

        it('should not log errors when logErrors is false', async () => {
            const promises = [Promise.reject(new Error('test error'))];

            await PromiseUtils.allSettledValues(promises, { logErrors: false });

            expect(console.error).not.toHaveBeenCalled();
        });

        it('should handle empty array', async () => {
            const results = await PromiseUtils.allSettledValues([]);
            expect(results).toEqual([]);
        });
    });

    describe('safeAll', () => {
        it('should return results and errors separately', async () => {
            const promises = [
                Promise.resolve('a'),
                Promise.reject(new Error('failed')),
                Promise.resolve('c')
            ];

            const { results, errors, hasErrors, allSucceeded } = await PromiseUtils.safeAll(promises);

            expect(results).toEqual(['a', null, 'c']);
            expect(errors).toHaveLength(1);
            expect(errors[0].index).toBe(1);
            expect(hasErrors).toBe(true);
            expect(allSucceeded).toBe(false);
        });

        it('should throw when all promises fail', async () => {
            const promises = [
                Promise.reject(new Error('fail1')),
                Promise.reject(new Error('fail2'))
            ];

            await expect(PromiseUtils.safeAll(promises, { context: 'Test' }))
                .rejects.toThrow('[Test] All 2 promises failed');
        });

        it('should throw when requireAll is true and some fail', async () => {
            const promises = [
                Promise.resolve('a'),
                Promise.reject(new Error('failed'))
            ];

            await expect(PromiseUtils.safeAll(promises, { requireAll: true, context: 'Test' }))
                .rejects.toThrow('[Test] 1/2 promises failed');
        });

        it('should not throw when requireAll is false and some fail', async () => {
            const promises = [
                Promise.resolve('a'),
                Promise.reject(new Error('failed'))
            ];

            const { results, hasErrors } = await PromiseUtils.safeAll(promises, { requireAll: false });

            expect(results).toEqual(['a', null]);
            expect(hasErrors).toBe(true);
        });

        it('should report allSucceeded correctly when no errors', async () => {
            const promises = [Promise.resolve('a'), Promise.resolve('b')];

            const { allSucceeded, hasErrors } = await PromiseUtils.safeAll(promises);

            expect(allSucceeded).toBe(true);
            expect(hasErrors).toBe(false);
        });
    });

    describe('safe', () => {
        it('should return function result on success', async () => {
            const fn = async () => 'result';
            const safeFn = PromiseUtils.safe(fn);

            const result = await safeFn();

            expect(result).toBe('result');
        });

        it('should return default value on error', async () => {
            const fn = async () => { throw new Error('oops'); };
            const safeFn = PromiseUtils.safe(fn, { defaultValue: 'default' });

            const result = await safeFn();

            expect(result).toBe('default');
        });

        it('should return null as default when not specified', async () => {
            const fn = async () => { throw new Error('oops'); };
            const safeFn = PromiseUtils.safe(fn);

            const result = await safeFn();

            expect(result).toBeNull();
        });

        it('should pass arguments through', async () => {
            const fn = async (a, b) => a + b;
            const safeFn = PromiseUtils.safe(fn);

            const result = await safeFn(1, 2);

            expect(result).toBe(3);
        });

        it('should log error by default', async () => {
            const fn = async () => { throw new Error('test'); };
            const safeFn = PromiseUtils.safe(fn, { context: 'TestFn' });

            await safeFn();

            expect(console.error).toHaveBeenCalledWith(
                '[TestFn] Error:',
                expect.any(Error)
            );
        });
    });

    describe('withTimeout', () => {
        it('should return result when promise completes before timeout', async () => {
            const promise = Promise.resolve('quick');

            const result = await PromiseUtils.withTimeout(promise, 1000);

            expect(result).toBe('quick');
        });

        it('should throw when timeout is exceeded', async () => {
            const slowPromise = new Promise(resolve => setTimeout(() => resolve('slow'), 100));

            await expect(PromiseUtils.withTimeout(slowPromise, 10, 'Too slow'))
                .rejects.toThrow('Too slow');
        });

        it('should use default message when not provided', async () => {
            const slowPromise = new Promise(resolve => setTimeout(() => resolve('slow'), 100));

            await expect(PromiseUtils.withTimeout(slowPromise, 10))
                .rejects.toThrow('Operation timed out');
        });

        it('should propagate original error when promise rejects', async () => {
            const failingPromise = Promise.reject(new Error('Original error'));

            await expect(PromiseUtils.withTimeout(failingPromise, 1000))
                .rejects.toThrow('Original error');
        });
    });

    describe('retry', () => {
        it('should return result on first success', async () => {
            const fn = vi.fn().mockResolvedValue('success');

            const result = await PromiseUtils.retry(fn, { maxRetries: 3, initialDelay: 10 });

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should retry on failure and succeed', async () => {
            const fn = vi.fn()
                .mockRejectedValueOnce(new Error('fail1'))
                .mockRejectedValueOnce(new Error('fail2'))
                .mockResolvedValue('success');

            const result = await PromiseUtils.retry(fn, { maxRetries: 3, initialDelay: 10 });

            expect(result).toBe('success');
            expect(fn).toHaveBeenCalledTimes(3);
        });

        it('should throw after max retries exhausted', async () => {
            const fn = vi.fn().mockRejectedValue(new Error('always fails'));

            await expect(PromiseUtils.retry(fn, { maxRetries: 2, initialDelay: 10 }))
                .rejects.toThrow('always fails');

            expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
        });

        it('should stop retrying when shouldRetry returns false', async () => {
            const fn = vi.fn().mockRejectedValue(new Error('stop'));
            const shouldRetry = vi.fn().mockReturnValue(false);

            await expect(PromiseUtils.retry(fn, { maxRetries: 3, initialDelay: 10, shouldRetry }))
                .rejects.toThrow('stop');

            expect(fn).toHaveBeenCalledTimes(1);
            expect(shouldRetry).toHaveBeenCalledTimes(1);
        });
    });

    describe('sequence', () => {
        it('should execute promises in order', async () => {
            const order = [];
            const promiseFns = [
                async () => { order.push(1); return 'a'; },
                async () => { order.push(2); return 'b'; },
                async () => { order.push(3); return 'c'; }
            ];

            const results = await PromiseUtils.sequence(promiseFns);

            expect(results).toEqual(['a', 'b', 'c']);
            expect(order).toEqual([1, 2, 3]);
        });

        it('should stop on first error', async () => {
            const promiseFns = [
                async () => 'a',
                async () => { throw new Error('stop'); },
                async () => 'c'
            ];

            await expect(PromiseUtils.sequence(promiseFns)).rejects.toThrow('stop');
        });

        it('should handle empty array', async () => {
            const results = await PromiseUtils.sequence([]);
            expect(results).toEqual([]);
        });
    });

    describe('pool', () => {
        it('should execute all promises with concurrency limit', async () => {
            const promiseFns = [
                async () => 'a',
                async () => 'b',
                async () => 'c',
                async () => 'd'
            ];

            const results = await PromiseUtils.pool(promiseFns, 2);

            expect(results).toEqual(['a', 'b', 'c', 'd']);
        });

        it('should respect concurrency limit', async () => {
            let concurrent = 0;
            let maxConcurrent = 0;

            const promiseFns = Array(10).fill(null).map(() => async () => {
                concurrent++;
                maxConcurrent = Math.max(maxConcurrent, concurrent);
                await new Promise(resolve => setTimeout(resolve, 10));
                concurrent--;
                return 'done';
            });

            await PromiseUtils.pool(promiseFns, 3);

            expect(maxConcurrent).toBeLessThanOrEqual(3);
        });

        it('should handle empty array', async () => {
            const results = await PromiseUtils.pool([], 5);
            expect(results).toEqual([]);
        });

        it('should work when concurrency exceeds array length', async () => {
            const promiseFns = [async () => 'a', async () => 'b'];

            const results = await PromiseUtils.pool(promiseFns, 10);

            expect(results).toEqual(['a', 'b']);
        });
    });
});
