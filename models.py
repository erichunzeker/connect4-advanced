from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

class Player(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(20), nullable=False, unique=True)
    birthday = db.Column(db.Date, nullable=False)

    def birthday_format(self, format=None):
        if not format:
            return datetime.date.strftime('%B %d, %Y', self.birthday)
        else:
            return datetime.date.strftime(format, self.birthday)

    def games(self):
        return db.session.query(Game).filter(db.or_(Game.player_one_id==self.id, Game.player_two_id==self.id)).all()


class Game(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_one_id = db.Column(db.Integer, db.ForeignKey('player.id'))
    player_two_id = db.Column(db.Integer, db.ForeignKey('player.id'))
    turn = db.Column(db.Integer, nullable=False, default=0)
    game_over = db.Column(db.Boolean, nullable=False, default=False)
    winner_id = db.Column(db.Integer, db.ForeignKey('player.id'))

    player_one = db.relationship('Player', foreign_keys=[player_one_id], backref='games_player_one')
    player_two = db.relationship('Player', foreign_keys=[player_two_id], backref='games_player_two')
    winner = db.relationship('Player', foreign_keys=[winner_id], backref='games_winner')

    def game_title(self):
        return "%s vs %s" % (self.player_one.username, self.player_two.username)
