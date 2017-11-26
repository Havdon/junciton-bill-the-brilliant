// NOTE: The contents of this file will only be executed if
// you uncomment its entry in "assets/js/app.js".

// To use Phoenix channels, the first step is to import Socket
// and connect at the socket path in "lib/web/endpoint.ex":
import { Socket } from "phoenix"
import { USE_TEST_DATA, ASSUMED_MAX_BUS_REAL_SPEED } from './constants';

import { getSpeedAt } from './TestData';

export default function () {
    const data = {
        speed: 0 // km / h
    }

    let socket = new Socket("/socket", { params: { token: window.userToken } })

    socket.connect()

    // Now that you are connected, you can join channels with a topic:
    let channel = socket.channel("api:data", {})
    let index = 0;
    channel.on("data", (payload) => {
        try {
            const { BusId } = payload;
            if (BusId) {
                const CAN = payload[`fi/llb/bus/${BusId}/can/`]

            }

            if (!isNaN(payload.spd)) {
                const mPerH = parseFloat(payload.spd);
                const kmPerH = mPerH / 1000;
                data.speed = Math.round(kmPerH * 100) / 100;
            }

            if (USE_TEST_DATA) {
                data.speed = getSpeedAt(index);
            }
            data.speed = Math.min(ASSUMED_MAX_BUS_REAL_SPEED, data.speed);
            console.log(Math.round(data.speed  * 100) / 100 + ' km/h')
            index++;
        } catch (e) {
            console.error('Failed to parse API data', e);
        }
    });

    channel.join()
        .receive("ok", resp => { console.log("Joined successfully", resp) })
        .receive("error", resp => { console.log("Unable to join", resp) })

    return data;
}
