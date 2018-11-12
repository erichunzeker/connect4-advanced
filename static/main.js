function Player(name, birthday, id, tokenBool) {
    this.name = name;
    this.id = id ? id : -1;
    this.birthday = new Date(birthday);
    this.isRedToken = tokenBool;

    this.tokensRemaining = 21;
    this.remainingToWin = 4;

    this.winner = false;
}

function Connect4(p1, p2, gameId) {

    this.gameId = gameId ? gameId : -1;

    this.p1 = p1;
    this.p2 = p2;
    this.turn = 1;

    this.tokenState = []

    this.gameOver = false;

    this.currentPlayer = function() {
        if (this.p1.birthday > this.p2.birthday) {
            return this.turn % 2 == 0 ? this.p2 : this.p1;
        } else {
            return this.turn % 2 == 1 ? this.p1 : this.p2;
        }
    }

    function toggleCellHover(e) {
        var c = e.currentTarget.dataset.col;
        var tds = document.querySelectorAll('td.token[data-col="' + c + '"]');
        tds.forEach(function(item) {
            item.classList.toggle('token-hover');
        });
    }

    this.cacheGame = function() {
        localStorage.setItem('game_' + this.gameId, JSON.stringify(this));
    }

    this.restoreGame = function() {
        return JSON.parse(localStorage.getItem('game_' + this.gameId));
    }

    var handleColumnClick = function(self) {
        return function(e) {
            var el = e.currentTarget;
            var p = self.currentPlayer();

            // place token
            var openCells = document.querySelectorAll('td.token-white.token[data-col="' + el.dataset.col + '"]');
            if (openCells.length > 0) {
                var o = openCells[openCells.length - 1];
                p.isRedToken ? o.classList.add('token-red') : o.classList.add('token-black');
                p.isRedToken ? o.dataset.color = 'red' : o.dataset.color = 'black';
                o.classList.remove('token-white');

                var tokenStateUpdate = self.tokenState.filter(function(item) {
                    return item.row == o.dataset.row && item.col == o.dataset.col;
                })[0];
                tokenStateUpdate.color = o.dataset.color;
                tokenStateUpdate.player = p;

                // Check win conditions
                self.checkTokenStatus();

                var d = p.isRedToken ? document.getElementById('p1-display') : document.getElementById('p2-display');
                // Subtract Token and update display
                p.tokensRemaining = p.tokensRemaining - 1;
                d.querySelector('.remaining').textContent = p.tokensRemaining;
                d.querySelector('.win-count').textContent = p.remainingToWin;
                if (!self.gameOver) {
                    document.querySelectorAll('li.player-name').forEach(function(item) {
                        item.classList.toggle('current-player');
                    });
                } else {
                    p.winner = true;
                    document.querySelector('li.player-name.current-player').classList.add('winner');
                    self.titleWin();
                }

                // Update turn and turn display
                self.turn = self.turn + 1;
                document.getElementById('gameturn').textContent = self.turn;
            }

            self.cacheGame();


            // If no more tokens, remove event listeners and make column unresponsive.
            if (openCells.length === 1 || self.gameOver || (self.p1.tokensRemaining === 0 || self.p2.tokensRemaining === 0)) {
                var cells;
                if (openCells.length === 1) {
                    cells = document.querySelectorAll('td.token[data-col="' + el.dataset.col + '"]');
                } else {
                    cells = document.querySelectorAll('td.token');
                }
                cells.forEach(function(item) {
                    item.removeEventListener('mouseenter', toggleCellHover);
                    item.removeEventListener('mouseleave', toggleCellHover);
                    item.classList.remove('token-hover');
                    item.removeEventListener('click', handleColumnClick);
                });
            }
        }
    }(this);

    this.checkTokenStatus = function() {

        var winCondition = false;

        this.tokenState.forEach(function(item, idx, arr) {
            var count = 0;
            var currentRow = item.row;
            var currentCol = item.col;
            var color = item.color;

            if (color != undefined) {
                var rowRangeStart = currentRow - 3 <= 0 ? 0 : currentRow - 3;
                var rowRangeEnd = currentRow + 3 >= 5 ? 5 : currentRow + 3;

                var colRangeStart = currentCol - 3 <= 0 ? 0 : currentCol - 3;
                var colRangeEnd = currentCol + 3 >= 6 ? 6 : currentCol + 3;

                var rowCount = arr.filter(function(rItem) {
                    return rowRangeStart <= rItem.row && rItem.row <= rowRangeEnd && rItem.col == currentCol;
                }).reduce(function(agg, v) {
                    if (v.color == color && color != undefined) {
                        return agg + 1;
                    }
                    return 0;
                }, count);

                var colCount = arr.filter(function(cItem) {
                    return colRangeStart <= cItem.col && cItem.col <= colRangeEnd && cItem.row == currentRow;
                }).reduce(function(agg, v) {
                    if (v.color == color && color != undefined) {
                        return agg + 1;
                    }
                    return 0;
                }, count);

                function getDiagonalPoints(cr, cc, height, width, leftToRight) {
                    var diagPoints = new Array();
                    if (leftToRight) {
                        for (var diag = 0; diag <= width + height - 2; diag++) {
                            points = new Array();
                            for (var j = 0; j <= diag; j++) {
                                var i = diag - j;
                                if (i < height && j < width) {
                                    points.push([i, j]);
                                }
                            }
                            if (points.some(function(item) {
                                    return JSON.stringify(item).includes(JSON.stringify([cr, cc]));
                                })) {
                                diagPoints.push(points);
                            }
                        }
                    } else {
                        for (var diag = width + height - 2; diag >= 0; diag--) {
                            points = new Array();
                            for (var j = 0; j <= diag; j++) {
                                var i = diag - j;
                                var y = width - j;
                                if (i < height && y < width) {
                                    points.push([i, y]);
                                }
                            }
                            if (points.some(function(item) {
                                    return JSON.stringify(item).includes(JSON.stringify([cr, cc]));
                                })) {
                                diagPoints.push(points);
                            }
                        }
                    }
                    return diagPoints;
                }

                var leftToRightPoints = getDiagonalPoints(currentRow, currentCol, 6, 7, true);
                var rightToLeftPoints = getDiagonalPoints(currentRow, currentCol, 6, 7, false);

                function countDiags(diags) {
                    return arr.filter(function(dItem) {
                        return diags.some(function(pointCheck) {
                            return JSON.stringify(pointCheck).includes(JSON.stringify([dItem.row, dItem.col]));
                        });
                    }).reduce(function(agg, v) {
                        if (v.color == color && color != undefined) {
                            return agg + 1;
                        }
                        return 0;
                    }, count);
                }

                var lDiagCount = countDiags(leftToRightPoints);
                var rDiagCount = countDiags(rightToLeftPoints);

                // console.log(lDiagCount);

                var remaining = 4 - Math.max(rowCount, colCount, lDiagCount, rDiagCount);
                // item.player.remainingToWin = 4 - Math.max(rowCount, colCount, lDiagCount, rDiagCount);

                item.player.remainingToWin = remaining <= item.player.remainingToWin ? remaining : item.player.remainingToWin;

                if (item.player.remainingToWin === 0) {
                    console.log(item.player.name + " WINS!");
                    winCondition = true;
                }
            }

        });

        this.gameOver = winCondition;
    }

    this.titleWin = function() {
        if (this.gameOver) {
            var winText = document.getElementById('title').textContent;
            if (this.p1.winner) {
                winText = winText + ": " + this.p1.name + " Wins!";
            } else {
                winText = winText + ": " + this.p2.name + " Wins!";
            }

            document.getElementById('title').textContent = winText;
        }
    }

    this.makePlayerDisplay = function(player) {
        var displayEl = player.isRedToken ? document.getElementById('p1-display') : document.getElementById('p2-display');
        var ulel = document.createElement('ul');
        ulel.classList.add('player-data')

        var liUser = document.createElement('li');
        liUser.textContent = player.name;
        liUser.classList.add('player-name')
        if (player == this.currentPlayer() && !this.gameOver) {
            liUser.classList.add('current-player');
        }
        if (player.winner && this.gameOver) {
            liUser.classList.add('current-player', 'winner');
            this.titleWin();
        }
        ulel.appendChild(liUser);

        liTurnsRemaining = document.createElement('li');
        liTurnsRemaining.innerHTML = "Remaining Tokens: <span class='remaining'>" + player.tokensRemaining + "</span>";
        ulel.appendChild(liTurnsRemaining);

        liLeftToWin = document.createElement('li');
        liLeftToWin.innerHTML = "Left to Win: <span class='win-count'>" + player.remainingToWin + "</span>"
        ulel.appendChild(liLeftToWin);

        displayEl.appendChild(ulel);
    }

    this.makeBoard = function() {

        var boardCanvas = document.getElementById('gameboard');

        var table = document.createElement('table');
        var newGame = this.tokenState.length === 0;
        table.id = 'connect-table'
        rows = 6;
        columns = 7;

        for (var i = 0; i < rows; i++) {
            var trEl = document.createElement('tr');
            for (var j = 0; j < columns; j++) {
                var tdEl = document.createElement('td');
                var tokenData;
                if (newGame) {
                    this.tokenState.push({ row: i, col: j, color: undefined, player: undefined });
                } else {
                    tokenData = this.tokenState.filter(function(item) {
                        return item.row == i && item.col == j;
                    })
                }
                if (tokenData && tokenData[0]) {
                    var tmpColor = tokenData[0].color ? tokenData[0].color : 'white'
                    tdEl.dataset.color = tmpColor;
                    tdEl.classList.add('token-' + tmpColor, 'token');
                } else {
                    tdEl.dataset.color = 'white';
                    tdEl.classList.add('token-white', 'token');
                }
                tdEl.dataset.row = i;
                tdEl.dataset.col = j;
                if (!this.gameOver) {
                    tdEl.addEventListener('mouseenter', toggleCellHover);
                    tdEl.addEventListener('mouseleave', toggleCellHover);
                    tdEl.addEventListener('click', handleColumnClick);
                }
                trEl.append(tdEl);
            }
            trEl.classList.add('token-row');
            table.append(trEl);
        }
        boardCanvas.append(table);
    }

    if (this.restoreGame()) {
        var cached = this.restoreGame();
        this.gameOver = cached.gameOver;
        this.turn = cached.turn;
        this.tokenState = cached.tokenState;
        this.p1 = cached.p1;
        this.p2 = cached.p2;
    }

    document.addEventListener('DOMContentLoaded', function(self) {
        return function(e) {
            self.makeBoard();
            self.makePlayerDisplay(self.p1);
            self.makePlayerDisplay(self.p2);
            document.getElementById('gameturn').textContent = self.turn;
        }
    }(this));
}