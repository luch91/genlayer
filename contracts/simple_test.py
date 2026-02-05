# { "Depends": "py-genlayer:test" }

from genlayer import *


class SimpleTest(gl.Contract):
    value: u32

    def __init__(self, initial: u32):
        self.value = initial

    @gl.public.view
    def get_value(self) -> u32:
        return self.value

    @gl.public.write
    def set_value(self, new_value: u32):
        self.value = new_value
