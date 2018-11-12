from flask import Flask, request, session, render_template, abort
from models import db, Player, Game
import datetime
import os

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
    app.root_path, "connect4.db"
)
# Suppress deprecation warning
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)


@app.route("/")
def home():
    games = db.session.query(Game).all()
    return render_template("landing.html", games=games)


@app.route("/game/<game_id>/")
def game(game_id=None):
    if game_id:
        game = db.session.query(Game).get(game_id)
        return render_template("game.html", game=game)

    return abort(404)



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

    p1 = Player(username="tow", birthday=datetime.datetime.strptime('11/06/1991', '%m/%d/%Y').date())
    p2 = Player(username="twaits", birthday=datetime.datetime.strptime('01/14/1987', '%m/%d/%Y').date())

    db.session.add(p1)
    print("Created %s" % p1.username)
    db.session.add(p2)
    print("Created %s" % p2.username)

    g.player_one = p1
    g.player_two = p2

    db.session.commit()
    print("Added dummy data.")


if __name__ == "__main__":
    app.run(threaded=True)
