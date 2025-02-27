#Inbox

[[250211_RL笔记]]

state value based function 和 state action value based function 的关系

$V_{\pi}(s) = \sum_{a\in\mathcal{A}}\pi(a|s)Q_{\pi}(s, a)$
$Q_{\pi}(s, a) = \sum_{s'\in\mathcal{S}}P(s'|s, a)\left[R(s,a,s') + \gamma V_{\pi}(s')\right]$