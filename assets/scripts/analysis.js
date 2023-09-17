function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

const toDegrees = radians => (radians * 180) / Math.PI
const toRadians = degrees => (degrees * Math.PI) / 180
class Vector {
    // https://radzion.com/blog/linear-algebra/vectors

    constructor(...components) {
        this.components = components
    }

    get dimensions() {
        return this.components.length
    }

    get x() {
        if (this.dimensions < 1) {
            throw new Error(`Intentando conseguir componente x en vector de ${this.dimensions} dimensiones`)
        }

        return this.components[0]
    }

    get y() {
        if (this.dimensions < 2) {
            throw new Error(`Intentando conseguir componente y en vector de ${this.dimensions} dimensiones`)
        }
        
        return this.components[1]
    }

    get z() {
        if (this.dimensions < 3) {
            throw new Error(`Intentando conseguir componente z en vector de ${this.dimensions} dimensiones`)
        }
        
        return this.components[2]
    }

    scaledBy(number) {
        return new Vector(
        ...this.components.map(component => component * number)
        )
    }

    length() {
        return Math.hypot(...this.components)
    }

    normalized() {
        return this.scaledBy(1 / this.length())
    }

    rotated2d(angle) {
        let rAngle = toRadians(angle)

        if (this.dimensions != 2) {
            throw new Error(`Intentando rotar  en 2d un vector que es ${this.dimensions}`)
        }

        return new Vector(
            (this.x * Math.cos(rAngle)) - (this.y * Math.sin(rAngle)),
            (this.x * Math.sin(rAngle)) + (this.y * Math.cos(rAngle))
        )
    }

    static substract(v1, v2) {
        if (v1.dimensions != v2.dimensions) {
            throw new Error("Intentando restar vectores con diferentes dimensiones")
        }

        let components1 = v1.components
        let components2 = v2.components

        return new Vector(
            ...components1.map((component, index) => {
                return components2[index] - component
            })
        )
    }

    static add(v1, v2) {
        if (v1.dimensions != v2.dimensions) {
            throw new Error("Intentando sumar vectores con diferentes dimensiones")
        }

        let components1 = v1.components
        let components2 = v2.components

        return new Vector(
            ...components1.map((component, index) => components2[index] + component)
        )
    }

    static dotProduct(v1, v2) {
        let components1 = v1.components
        let components2 = v2.components
        return components2.reduce((acc, component, index) => acc + component * components1[index], 0)
    }

    static angleBetween(v1, v2) {
        return toDegrees(
          Math.acos(
            Vector.dotProduct(v1, v2) /
            (v1.length() * v2.length())
          )
        )
    }
}

export class Hand {
    constructor(points, isRightHand) {
        this._points = points.map(pt => new Vector(pt.x, pt.y, pt.z))
        this.isRightHand = isRightHand

        this.constructFingers()
        this.getHandOrientation()
    }

    static angleWindow = 45

    static thresholds = { // TEMPORAL
        'index': 0,
        'middle': 0,
        'ring': 0,
        'pinky': 0,
        'thumb': 30
    }

    pointsToVectors(points) {
        let vectors = []
        for(let i = 1; i < points.length; i++) {
            let index1 = points[i-1]
            let index2 = points[i]

            let point1 = this._points[index1]
            let point2 = this._points[index2]

            const vec = Vector.substract(point2, point1)
            vectors.push(vec.normalized())
        }

        return vectors
    }

    isFingerCurled(finger) {
        let fingerVectors = this.fingers[finger]
        if (fingerVectors === undefined) {
            throw new Error('Dedo no encontrado')
        }

        let lastVector = fingerVectors[fingerVectors.length-1]
        lastVector.components.pop()

        lastVector = lastVector.normalized()

        let comparisonVector = new Vector(0, 1)

        comparisonVector = comparisonVector.rotated2d(this.handAngle)

        if (finger == 'thumb') {
            if ((this.isRightHand || this.palmForward) && !(this.isRightHand && this.palmForward)) {
                // Rotate clockwise
                comparisonVector = comparisonVector.rotated2d(Hand.thresholds['thumb'])
            } else {
                // Rotate counter-clockwise
                comparisonVector = comparisonVector.rotated2d(-Hand.thresholds['thumb'])
            }
        }

        const angle = Vector.angleBetween(lastVector, comparisonVector)

        return angle > Hand.angleWindow

        // let dotAccumulation = 0

        // for (let i = 1; i < fingerVectors.length; i++) {
        //     let vec1 = fingerVectors[i-1]
        //     let vec2 = fingerVectors[i]

        //     let dot = Math.abs(Vector.dotProduct(vec1, vec2))
            
        //     dotAccumulation += dot
        // }

        // return dotAccumulation < Hand.thresholds[finger]
    }

    getHandOrientation() {
        let midPointLeft = this._points[9]

        let wristPoint = this._points[0]

        let rotationVector = Vector.substract(midPointLeft, wristPoint)
        let angle = Vector.angleBetween(rotationVector, new Vector(0, 1))
        if (midPointLeft.x > wristPoint.x) {
            angle *= -1
        }

        this.handAngle = -angle
    }

    constructFingers() {
        // Calcular y guardar los vectores aquí
        const fingers = {}
        let indexPoints = [5, 6, 7, 8]
        fingers.index = this.pointsToVectors(indexPoints)

        let middlePoints = [9, 10, 11, 12]
        fingers.middle = this.pointsToVectors(middlePoints)

        let ringPoints = [13, 14, 15, 16]
        fingers.ring = this.pointsToVectors(ringPoints)
        
        let pinkyPoints = [17, 18, 19, 20]
        fingers.pinky = this.pointsToVectors(pinkyPoints)

        let thumbPoints = [1, 2, 3, 4]
        fingers.thumb = this.pointsToVectors(thumbPoints)

        let palmForward = false
        if (this.isRightHand) {
            palmForward = this._points[1].x < this._points[17].x
        } else {
            palmForward = this._points[17].x < this._points[1].x
        }

        this.fingers = fingers
        this.palmForward = palmForward
    }

}

window.VectorClass = Vector

const resultsDiv = document.getElementById('results')

async function displayResults(results) {
    let contents = "<h1>Results</h1>\n<div id='hands-list'>"
    for (let {hand, value} of results) {
        contents += `
        <div class="hand-result">
            <h2>Posiblemente: ${value}</h2>
            
            <h3>Mano ${hand.isRightHand ? "derecha" : "izquierda"}</h3>
            <h3>Palma al frente? ${hand.palmForward ? "Sí" : "No"}</h3>
        </div>
        `

        /*<ul>
            <li>${hand.isFingerCurled('index')}</li>
            <li>${hand.isFingerCurled('middle')}</li>
            <li>${hand.isFingerCurled('ring')}</li>
            <li>${hand.isFingerCurled('pinky')}</li>
            <li>${hand.isFingerCurled('thumb')}</li>
        </ul> */
    }
    contents += "</div>"

    resultsDiv.innerHTML = contents
}

export async function analyze(hands) {
    let results = []
    for (let hand of hands) {
        const fingers = [
            hand.isFingerCurled('index'),
            hand.isFingerCurled('middle'),
            hand.isFingerCurled('ring'),
            hand.isFingerCurled('pinky'),
            hand.isFingerCurled('thumb')
        ]

        let result

        if (arrayEquals(fingers, [false, true, true, true, true])) {
            result = "1"
        } else if (arrayEquals(fingers, [false, false, true, true, true])) {
            result = "2"
        } else if (arrayEquals(fingers, [false, false, false, true, true])) {
            result = "3"
        } else if (arrayEquals(fingers, [false, false, false, false, true])) {
            result = "4"
        } else if (arrayEquals(fingers, [false, false, false, false, false])) {
            result = "5"
        } else if (arrayEquals(fingers, [true, true, true, true, true])) {
            result = "0"
        } else {
            result = "?"
        }

        results.push({hand, value: result})
    }

    await displayResults(results)
}

const canvasElement = document.getElementById(
    "output_canvas"
);
const canvasCtx = canvasElement.getContext("2d");

function drawResult(pt, text) {
    canvasCtx.save()
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)



    canvasCtx.restore()
}