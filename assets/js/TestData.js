
import { lerp } from './utils';

const speeds_data = [
    { speed: 5, time: 0 },
    { speed: 80, time: 15 },
    { speed: 0, time: 10 },
    { speed: 50, time: 8 },
    { speed: 70, time: 5 },
    { speed: 0, time: 10 }
]

let prevValue = 0;
const speeds = speeds_data.flatMap(({ speed, time }) => {
    const result = [];
    for (var i = 0; i < time; i++) {
        const lerpedSpeed = lerp(prevValue, speed, (1 / time) * i);
        result.push(lerpedSpeed);
        prevValue = lerpedSpeed;
    }
    return result;
})

export function getSpeedAt(second) {
    return speeds[second % speeds.length]
}