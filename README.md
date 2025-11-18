# Blind Drawing

A computational creativity project exploring how the absence of visual feedback during the creative process can enhance artistic expression, embrace mistakes, and reveal unexpected creativity.

## Concept

This project plays with the idea that not seeing your art while creating it can transform the drawing experience. By hiding the canvas during creation, artists are freed from self-judgment and perfectionism, allowing mistakes to become features rather than flaws. The blind drawing process encourages spontaneity, forces reliance on muscle memory and intuition, and often results in surprising, creative outcomes that wouldn't emerge through traditional drawing methods.

When you finally reveal your creation, you discover something entirely new—a work shaped by the absence of visual control, where every stroke is an act of trust in the creative process.

## Features

- **Hidden Canvas**: Draw without seeing your creation in real-time
- **Reveal Function**: Press `r` to toggle visibility and see your artwork
- **Color Selection**: Choose from 5 colors (black, green, blue, red, yellow) using number keys 1-5
- **Save Function**: Press `s` to save your drawing as a PNG file

## How to Use

1. Open `screen.html` in a web browser
2. Use your mouse to draw on the canvas (you won't see the drawing as you create it)
3. Press `r` to reveal or hide your drawing
4. Press number keys `1-5` to change stroke colors:
   - `1` = Black
   - `2` = Green
   - `3` = Blue
   - `4` = Red
   - `5` = Yellow
5. Press `s` to save your drawing

## Technical Details

Built with p5.js, this project uses a hidden graphics buffer to store the drawing while displaying a black canvas to the user. The drawing is only revealed when the user chooses to toggle visibility.

## Credits

Created for Computational Creativity class.
