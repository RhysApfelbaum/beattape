#[cfg(test)]
mod buffer {

    use beatbuff::buffer::RingBuffer;

    #[test]
    fn test_init_state() {
        let b: RingBuffer<u8> = RingBuffer::new(4);

        assert_eq!(b.capacity(), 4);
        assert_eq!(b.filled_length(), 0);
        assert_eq!(b.empty_length(), 4);
        assert!(b.empty());
        assert!(!b.full());
    }

    #[test]
    fn test_write_basic_fill() {
        let mut b = RingBuffer::new(4);

        let leftover = b.write(&[1, 2]);

        assert!(leftover.is_none());
        assert_eq!(b.filled_length(), 2);
        assert_eq!(b.empty_length(), 2);
        assert!(!b.empty());
       assert!(!b.full());
    }

    #[test]
    fn test_exact_fill_sets_full() {
        let mut b = RingBuffer::new(3);

        let leftover = b.write(&[1, 2, 3]);

        assert!(leftover.is_none());
        assert_eq!(b.filled_length(), 3);
        assert_eq!(b.empty_length(), 0);
        assert!(b.full());
        assert!(!b.empty());
    }

    #[test]
    fn test_overflow_returns_leftover() {
        let mut b = RingBuffer::new(3);

        let leftover = b.write(&[1, 2, 3, 4, 5]);

        assert!(leftover.is_some());
        let rem = leftover.unwrap();
        assert_eq!(rem.len(), 2);
        assert_eq!(b.filled_length(), 3);
        assert!(b.full());
    }

    #[test]
    fn test_free_reduces_fill_and_clears_full() {
        let mut b = RingBuffer::new(4);

        b.write(&[1, 2, 3, 4]);
        assert!(b.full());

        b.free_up_space(2);

        assert_eq!(b.filled_length(), 2);
        assert_eq!(b.empty_length(), 2);
        assert!(!b.full());
        assert!(!b.empty());
    }

    #[test]
    fn test_empty_after_full_cycle() {
        let mut b = RingBuffer::new(3);

        b.write(&[1, 2, 3]);
        assert!(b.full());

        b.free_up_space(3);

        assert!(b.empty());
        assert_eq!(b.filled_length(), 0);
        assert_eq!(b.empty_length(), 3);
        assert!(!b.full());
    }

    #[test]
    fn test_multiple_cycles_stability() {
        let mut b = RingBuffer::new(5);

        for i in 0..20 {
            let chunk = [i as u8; 2];

            let _ = b.write(&chunk);

            let free = b.filled_length() / 2;
            b.free_up_space(free);

            assert!(b.filled_length() <= b.capacity());
            assert!(b.empty_length() <= b.capacity());
            assert_eq!(
                b.filled_length() + b.empty_length(),
                b.capacity()
            );
        }
    }
}
