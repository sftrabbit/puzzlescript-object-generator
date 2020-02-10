const { BYTES_PER_PIXEL } = require('./image')

class PuzzleScriptObject {
  constructor (name, image) {
    this.name = name
    this.palette = []
    this.pixels = []

    for (let y = 0; y < image.height; y++) {
      this.pixels.push([])

      for (let x = 0; x < image.width; x++) {
        const pixelOffset = (y * image.width + x) * BYTES_PER_PIXEL
        const pixelValue = image.data.readUIntBE(pixelOffset, BYTES_PER_PIXEL)

        if ((pixelValue & 0x000000ff) < 0xff) {
          this.pixels[y].push(null)
          continue
        }

        const colorValue = pixelValue >>> 8

        if (!this.palette.includes(colorValue)) {
          if (this.palette.length > 10) {
            throw new Error(`Object ${this.name} has more than 10 colours`)
          }
          this.palette.push(colorValue)
        }

        this.pixels[y].push(this.palette.indexOf(colorValue))
      }
    }
  }

  isBlank () {
    return this.pixels.every((pixelRow) => {
      return pixelRow.every((pixel) => pixel === null)
    })
  }

  format () {
    const formattedPalette = this.palette.map(formatHexColor)

    const formattedPixels = this.pixels.map((pixelRow) => {
      return pixelRow.map((colorIndex) => colorIndex !== null ? colorIndex.toString() : '.')
    })

    let formattedObject = `${this.name}\n`

    formattedObject += `${formattedPalette.join(' ')}\n`
    for (const pixelRow of formattedPixels) {
      formattedObject += `${pixelRow.join('')}\n`
    }
    formattedObject += `\n`

    return formattedObject
  }
}

function formatHexColor (value) {
  return `#${value.toString(16).padStart(6, '0')}`
}

module.exports = {
  PuzzleScriptObject
}
