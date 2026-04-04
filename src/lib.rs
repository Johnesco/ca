use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Clone, Copy, PartialEq)]
pub enum CaKind {
    LifeLike = 0,
    Elementary = 1,
    BriansBrain = 2,
    Wireworld = 3,
    Cyclic = 4,
}

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<u8>,
    scratch: Vec<u8>,
    kind: CaKind,
    // Life-like params (bitmasks: bit N = neighbor count N)
    birth: u16,
    survival: u16,
    // Elementary params
    rule: u8,
    elem_row: u32,
    // Cyclic params
    num_states: u8,
    threshold: u8,
}

#[wasm_bindgen]
impl Universe {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> Universe {
        let size = (width * height) as usize;
        Universe {
            width,
            height,
            cells: vec![0u8; size],
            scratch: vec![0u8; size],
            kind: CaKind::LifeLike,
            birth: 0b000001000,    // B3
            survival: 0b000001100, // S23
            rule: 30,
            elem_row: 0,
            num_states: 16,
            threshold: 3,
        }
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn cells_ptr(&self) -> *const u8 {
        self.cells.as_ptr()
    }

    pub fn kind(&self) -> CaKind {
        self.kind
    }

    pub fn max_state(&self) -> u8 {
        match self.kind {
            CaKind::LifeLike | CaKind::Elementary => 1,
            CaKind::BriansBrain => 2,
            CaKind::Wireworld => 3,
            CaKind::Cyclic => self.num_states.saturating_sub(1),
        }
    }

    // --- Setters for CA type and params ---

    pub fn set_life_like(&mut self, birth: u16, survival: u16) {
        self.kind = CaKind::LifeLike;
        self.birth = birth;
        self.survival = survival;
    }

    pub fn update_life_like(&mut self, birth: u16, survival: u16) {
        self.birth = birth;
        self.survival = survival;
    }

    pub fn set_elementary(&mut self, rule: u8) {
        self.kind = CaKind::Elementary;
        self.rule = rule;
        self.elem_row = 0;
        for cell in self.cells.iter_mut() {
            *cell = 0;
        }
        self.cells[(self.width / 2) as usize] = 1;
    }

    pub fn update_elementary(&mut self, rule: u8) {
        self.rule = rule;
    }

    pub fn set_brians_brain(&mut self) {
        self.kind = CaKind::BriansBrain;
    }

    pub fn set_wireworld(&mut self) {
        self.kind = CaKind::Wireworld;
    }

    pub fn set_cyclic(&mut self, num_states: u8, threshold: u8) {
        self.kind = CaKind::Cyclic;
        self.num_states = num_states.max(2);
        self.threshold = threshold.max(1);
    }

    pub fn update_cyclic(&mut self, num_states: u8, threshold: u8) {
        self.num_states = num_states.max(2);
        self.threshold = threshold.max(1);
    }

    // --- Simulation ---

    pub fn tick(&mut self) {
        match self.kind {
            CaKind::LifeLike => self.tick_life_like(),
            CaKind::Elementary => self.tick_elementary(),
            CaKind::BriansBrain => self.tick_brians_brain(),
            CaKind::Wireworld => self.tick_wireworld(),
            CaKind::Cyclic => self.tick_cyclic(),
        }
    }

    // --- Cell manipulation ---

    pub fn toggle_cell(&mut self, row: u32, col: u32) {
        if row >= self.height || col >= self.width {
            return;
        }
        let idx = (row * self.width + col) as usize;
        let max = self.max_state() + 1;
        self.cells[idx] = (self.cells[idx] + 1) % max;
    }

    pub fn set_cell(&mut self, row: u32, col: u32, state: u8) {
        if row >= self.height || col >= self.width {
            return;
        }
        let idx = (row * self.width + col) as usize;
        self.cells[idx] = state;
    }

    pub fn clear(&mut self) {
        for cell in self.cells.iter_mut() {
            *cell = 0;
        }
        if self.kind == CaKind::Elementary {
            self.elem_row = 0;
            self.cells[(self.width / 2) as usize] = 1;
        }
    }

    pub fn randomize(&mut self, seed: u32) {
        let mut rng: u64 = seed as u64;
        let max = match self.kind {
            CaKind::LifeLike | CaKind::Elementary => 2,
            CaKind::BriansBrain => 3,
            CaKind::Wireworld => 4,
            CaKind::Cyclic => self.num_states as u64,
        };
        for cell in self.cells.iter_mut() {
            rng = rng.wrapping_mul(6364136223846793005).wrapping_add(1);
            *cell = ((rng >> 33) % max) as u8;
        }
        if self.kind == CaKind::Elementary {
            self.elem_row = self.height - 1;
        }
    }
}

// --- Private tick implementations ---
impl Universe {
    fn idx(&self, row: u32, col: u32) -> usize {
        (row * self.width + col) as usize
    }

    fn count_moore(&self, row: u32, col: u32, state: u8) -> u8 {
        let w = self.width;
        let h = self.height;
        let mut count = 0u8;
        for dr in [h - 1, 0, 1] {
            for dc in [w - 1, 0, 1] {
                if dr == 0 && dc == 0 {
                    continue;
                }
                let idx = self.idx((row + dr) % h, (col + dc) % w);
                if self.cells[idx] == state {
                    count += 1;
                }
            }
        }
        count
    }

    fn count_moore_alive(&self, row: u32, col: u32) -> u8 {
        let w = self.width;
        let h = self.height;
        let mut count = 0u8;
        for dr in [h - 1, 0, 1] {
            for dc in [w - 1, 0, 1] {
                if dr == 0 && dc == 0 {
                    continue;
                }
                let idx = self.idx((row + dr) % h, (col + dc) % w);
                count += self.cells[idx] & 1;
            }
        }
        count
    }

    fn tick_life_like(&mut self) {
        let (w, h) = (self.width, self.height);
        for row in 0..h {
            for col in 0..w {
                let idx = self.idx(row, col);
                let neighbors = self.count_moore_alive(row, col);
                let mask = 1u16 << neighbors;
                self.scratch[idx] = if self.cells[idx] == 1 {
                    u8::from(self.survival & mask != 0)
                } else {
                    u8::from(self.birth & mask != 0)
                };
            }
        }
        std::mem::swap(&mut self.cells, &mut self.scratch);
    }

    fn tick_elementary(&mut self) {
        let (w, h) = (self.width, self.height);

        if self.elem_row < h - 1 {
            let src = self.elem_row;
            let dst = src + 1;
            for col in 0..w {
                let l = self.cells[self.idx(src, (col + w - 1) % w)];
                let c = self.cells[self.idx(src, col)];
                let r = self.cells[self.idx(src, (col + 1) % w)];
                let pattern = (l << 2) | (c << 1) | r;
                let dst_idx = self.idx(dst, col);
                self.cells[dst_idx] = (self.rule >> pattern) & 1;
            }
            self.elem_row += 1;
        } else {
            // Shift all rows up, compute new bottom row
            for row in 0..h - 1 {
                for col in 0..w {
                    let src_idx = self.idx(row + 1, col);
                    let dst_idx = self.idx(row, col);
                    self.cells[dst_idx] = self.cells[src_idx];
                }
            }
            let src = h - 2;
            let dst = h - 1;
            for col in 0..w {
                let l = self.cells[self.idx(src, (col + w - 1) % w)];
                let c = self.cells[self.idx(src, col)];
                let r = self.cells[self.idx(src, (col + 1) % w)];
                let pattern = (l << 2) | (c << 1) | r;
                let dst_idx = self.idx(dst, col);
                self.cells[dst_idx] = (self.rule >> pattern) & 1;
            }
        }
    }

    fn tick_brians_brain(&mut self) {
        let (w, h) = (self.width, self.height);
        for row in 0..h {
            for col in 0..w {
                let idx = self.idx(row, col);
                self.scratch[idx] = match self.cells[idx] {
                    1 => 2, // on → dying
                    2 => 0, // dying → off
                    _ => {
                        // off → on if exactly 2 "on" neighbors
                        if self.count_moore(row, col, 1) == 2 {
                            1
                        } else {
                            0
                        }
                    }
                };
            }
        }
        std::mem::swap(&mut self.cells, &mut self.scratch);
    }

    fn tick_wireworld(&mut self) {
        let (w, h) = (self.width, self.height);
        for row in 0..h {
            for col in 0..w {
                let idx = self.idx(row, col);
                self.scratch[idx] = match self.cells[idx] {
                    0 => 0, // empty
                    1 => 2, // head → tail
                    2 => 3, // tail → conductor
                    3 => {
                        // conductor → head if 1-2 head neighbors
                        let heads = self.count_moore(row, col, 1);
                        if heads == 1 || heads == 2 {
                            1
                        } else {
                            3
                        }
                    }
                    _ => 0,
                };
            }
        }
        std::mem::swap(&mut self.cells, &mut self.scratch);
    }

    fn tick_cyclic(&mut self) {
        let (w, h) = (self.width, self.height);
        let ns = self.num_states;
        let thresh = self.threshold;
        for row in 0..h {
            for col in 0..w {
                let idx = self.idx(row, col);
                let state = self.cells[idx];
                let next = (state + 1) % ns;
                let count = self.count_moore(row, col, next);
                self.scratch[idx] = if count >= thresh { next } else { state };
            }
        }
        std::mem::swap(&mut self.cells, &mut self.scratch);
    }
}
