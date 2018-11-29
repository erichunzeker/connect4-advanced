from flask import Flask, request, session, render_template, abort, redirect, url_for, flash, jsonify, json
from models import db, Player, Game
import datetime
import os

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
    app.root_path, "connect4.db"
)
# Suppress deprecation warning
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config.update(dict(
    DEBUG=True,
    SECRET_KEY='development key',

    SQLALCHEMY_DATABASE_URI='sqlite:///' + os.path.join(app.root_path, 'connect4.db')
))

db.init_app(app)


@app.route("/")
def home():
    games = db.session.query(Game).all()
    highscores =[]
    if session.get('logged_in'):
        newgames = [game for game in games if session['username'] == game.player_one.username or session['username'] == game.player_two.username]
        highscores = [game for game in games if game.game_over and game.winner.username == session['username']]
        highscores.sort(key=lambda game: game.turn, reverse=False)
        communityscores = [game for game in games if game.game_over]
        communityscores.sort(key=lambda game: game.turn, reverse=False)

    else:
        newgames = games
        communityscores = [game.turn for game in games if game.game_over]
        communityscores.sort()

    if highscores.__len__() > 9:
        highscores = highscores[:10]

    if communityscores.__len__() > 9:
        communityscores = communityscores[:10]

    if session.get('logged_in'):
        playa = session['username']
    else:
        playa = None
    return render_template("landing.html", games=newgames, highscores=highscores, player=playa, communityscores=communityscores)


@app.route("/game/<game_id>/", methods=['GET', 'POST'])
def game(game_id=None):
    if not session.get('logged_in'):
        abort(401)
    if game_id:
        game = db.session.query(Game).get(game_id)
        return render_template("game.html", game=game)

    return abort(404)


@app.route("/game/<game_id>/test", methods=['GET', 'POST'])
def update(game_id=None):
    if request.method == 'POST':
        t = request.data.__str__()
        t = t[2:t.__len__()-1]
        obj = json.loads(t)

        gameover = obj["gameOver"]
        id = obj["gameId"]
        turn = obj["turn"]
        g = Game.query.filter(Game.id == id).first()
        p1 = obj["p1"]["name"]
        p2 = obj["p2"]["name"]
        g.current_state = t

        if gameover:
            if obj["p1"]["winner"]:
                winner = g.player_one
            else:
                winner = g.player_two
            g.game_over = True
            g.winner = winner
            g.turn = turn - 1
            db.session.commit()
        else:
            db.session.commit()
        return jsonify(request.json), 201

    return abort(404)


@app.route("/poll/<game_id>", methods=['GET', 'POST'])
def poll(game_id=None):
    print(request)
    if request.method == 'GET':
        g = Game.query.filter(Game.id == game_id).first()
        statestring = g.current_state
        # t = json.loads(statestring)
        print(statestring)
        return statestring, 200

    return abort(404)

@app.route("/newgame", methods=['GET', 'POST'])
def new_game():
    error = None
    if request.method == 'POST':
        g = Game()
        db.session.add(g)

        p1 = Player.query.filter(Player.username == session['username']).first()
        p2 = Player.query.filter(Player.username == request.form['name']).first()

        g.player_one = p1
        g.player_two = p2

        db.session.commit()

        return redirect(url_for('game', game_id=g.id))
    return render_template('newgame.html', error=error)


@app.route("/deletegame/<game_id>", methods=['GET', 'POST'])
def delete_game(game_id=None):
    if request.method == "POST":
        game = Game.query.filter(Game.id == game_id).first()
        print(game.id)
        print(game_id)
        print(game)
        db.session.delete(game)
        db.session.commit()

        return redirect(url_for('home'))
    return render_template('landing.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        players = Player.query.all()
        for player in players:
            if request.form['name'] == player.username and request.form['password'] == player.password:
                session['logged_in'] = True
                session['username'] = request.form['name']
                flash('You were logged in')
                return redirect(url_for('home'))
        flash("couldn't find you lel")
    return render_template('login.html', error=error)


@app.route('/register', methods=['GET', 'POST'])
def register():
    error = None
    if request.method == 'POST':
        bday = request.form['birthday']

        print(bday)
        p1 = Player(username=request.form['name'], password=request.form['password'], birthday=datetime.datetime.strptime(bday, "%Y-%m-%d").date())
        print(p1.birthday)
        db.session.add(p1)
        db.session.commit()
        return redirect(url_for('home'))
    return render_template('register.html', error=error)


@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You were logged out')
    session.pop('username', None)
    return redirect(url_for('home'))


# CLI Commands
@app.cli.command("initdb")
def init_db():
    """Initializes database and any model objects necessary for assignment"""
    db.drop_all()
    db.create_all()


    print("Initialized Connect 4 Database.")


@app.cli.command("devinit")
def init_dev_data():
    """Initializes database with data for development and testing"""
    db.drop_all()
    db.create_all()
    print("Initialized Connect 4 Database.")

    g = Game()

    db.session.add(g)

    p1 = Player(username="tow", password="a", birthday=datetime.datetime.strptime('11/06/1991', '%m/%d/%Y').date())
    p2 = Player(username="twaits", password="a", birthday=datetime.datetime.strptime('01/14/1987', '%m/%d/%Y').date())

    db.session.add(p1)
    print("Created %s" % p1.username)
    db.session.add(p2)
    print("Created %s" % p2.username)

    g.player_one = p1
    g.player_two = p2
    g.winner = p1
    g.turn = 8
    g.game_over = True

    db.session.commit()
    print("Added dummy data.")


if __name__ == "__main__":
    app.run(threaded=True)
