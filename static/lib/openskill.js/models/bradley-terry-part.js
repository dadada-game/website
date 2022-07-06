// import { zip } from '/static/lib/ramda.min.js'
import util, { score, ladderPairs } from '../util.js'
import constants from '../constants.js'

export default (game, options = {}) => {
  const { TWOBETASQ, EPSILON } = constants(options)
  const { teamRating, gamma } = util(options)

  const teamRatings = teamRating(game)
  const adjacentTeams = ladderPairs(teamRatings)

  return R.zip(teamRatings, adjacentTeams).map(([iTeamRating, iAdjacents]) => {
    const [iMu, iSigmaSq, iTeam, iRank] = iTeamRating
    const [iOmega, iDelta] = iAdjacents.reduce(
      ([omega, delta], [qMu, qSigmaSq, _qTeam, qRank]) => {
        const ciq = Math.sqrt(iSigmaSq + qSigmaSq + TWOBETASQ)
        const piq = 1 / (1 + Math.exp((qMu - iMu) / ciq))
        const sigSqToCiq = iSigmaSq / ciq
        const iGamma = gamma(ciq, teamRatings.length, ...iTeamRating)

        return [
          omega + sigSqToCiq * (score(qRank, iRank) - piq),
          delta + ((iGamma * sigSqToCiq) / ciq) * piq * (1 - piq),
        ]
      },
      [0, 0]
    )

    return iTeam.map(({ mu, sigma }) => {
      const sigmaSq = sigma * sigma
      return {
        mu: mu + (sigmaSq / iSigmaSq) * iOmega,
        sigma:
          sigma *
          Math.sqrt(Math.max(1 - (sigmaSq / iSigmaSq) * iDelta, EPSILON)),
      }
    })
  })
}
