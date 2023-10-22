import {writable} from 'svelte/store';
import socket from '../socket'

export default (function () {
    const { subscribe, update } = writable({
        id: '',
        owner: '',
        votes_revealed: false,
        settings: {}
    });

    let room_id = "";
    let saved_name = "";

    socket.addEventListener('message', function (event) {
        const message = JSON.parse(event.data);

        switch (message.action) {
            case 'roomcreated':
                join(message.data.room_id, saved_name);
                break;

            case 'roomupdate':
                room_id = message.data.room_id;

                update((room) => {
                    return {
                        id: room_id,
                        owner: message.data.room_owner,
                        votes_revealed: message.data.votes_revealed,
                        settings: message.data.room_settings
                    };
                });

                window.history.pushState(
                    { room_id: room_id },
                    '',
                    '?' + room_id
                );
                break;

            case 'votesreset':
                update((room) => {
                    return {
                        id: room.id,
                        owner: room.owner,
                        votes_revealed: false,
                        settings: room.settings
                    };
                });
                break;
        }
    });

    const create = function (name) {
        saved_name = name;

        socket.send(JSON.stringify({
            "action": "createroom",
            "data": {
                "settings": {
                    "test": "test"
                }
            }
        }));
    };

    const join = function (room_id, name) {
        socket.send(JSON.stringify({
            "action": "joinroom",
            "data": {
                "room_id": room_id,
                "name": name
            }
        }));
    };

    const changeSettings = function (new_settings) {
        update((room) => {
            return {
                id: room.id,
                owner: room.room_owner,
                votes_revealed: room.votes_revealed,
                settings: new_settings
            };
        });

        socket.send(JSON.stringify({
            "action": "changeroomsettings",
            "data": {
                "room_id": room_id,
                "settings": new_settings
            }
        }));
    };

    const revealVotes = function () {
        socket.send(JSON.stringify({
            "action": "revealvotes",
            "data": {
                "room_id": room_id
            }
        }));
    };

    const resetVotes = function () {
        socket.send(JSON.stringify({
            "action": "resetvotes",
            "data": {
                "room_id": room_id
            }
        }));
    };

    const fetchRoomInfo = function (joining_room_id) {
        socket.send(JSON.stringify({
            "action": "getroominfo",
            "data": {
                "room_id": joining_room_id
            }
        }));
    };

    return {
        subscribe,
        create,
        join,
        changeSettings,
        revealVotes,
        resetVotes,
        fetchRoomInfo
    }
})();
