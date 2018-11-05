from flask import Flask, request, session, render_template
from models import db, Player
from datetime import datetime
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
    players = db.session.query(Player).all()
    return render_template("game.html", players=players, content="Hello World")


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

    p1 = Player(username='tow')
    p2 = Player(username='twaits')

    db.session.add(p1)
    print("Created %s" % p1.username)
    db.session.add(p2)
    print("Created %s" % p2.username)

    db.session.commit()
    print("Added dummy data.")


if __name__ == "__main__":
    app.run()
