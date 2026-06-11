

pub struct Deque<T> {
    buf: Vec<T>,
    read_index: usize,
    write_index: usize
}

impl<T> Deque<T> {
    fn new() -> Self {
        Self {
            buf: Vec
        }
    }
}
