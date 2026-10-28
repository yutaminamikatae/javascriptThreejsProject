const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 静的ファイルの公開
app.use(express.static('.'));

// 接続中のプレイヤー管理
const players = {};

io.on('connection', (socket) => {
    console.log(`プレイヤーが接続しました: ${socket.id}`);

    // 新規プレイヤーの初期データを登録
    players[socket.id] = { x: 0, y: 0.9, z: 0 };

    // 現在いる全員のデータを新しい人に教える
    socket.emit('currentPlayers', players);

    // ほかの人には「新しい人が入ってきたよ」と伝える
    socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

    // プレイヤーが移動したときの処理
    socket.emit('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].z = movementData.z;
            // ほかのプレイヤー全員に「この人がここに動いたよ」と配信する
            socket.broadcast.emit('playerMoved', { id: socket.id, player: players[socket.id] });
        }
    });

    // 切断されたときの処理
    socket.on('disconnect', () => {
        console.log(`プレイヤーが切断しました: ${socket.id}`);
        delete players[socket.id];
        io.emit('disconnectPlayer', socket.id);
    });
});

server.listen(3000, () => {
    console.log('サーバーが起動しました: http://localhost:3000');
});