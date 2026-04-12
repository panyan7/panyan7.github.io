---
title: "Zeroth-Order Online Convex Optimization"
date: "2025-05-01"
language: en
---


---

## Background on Convex Optimization

A set $\mathcal{D}$ is convex if for every $x, y \in \mathcal{D}$, $0 \le \lambda \le 1$, we have

$$
\lambda x + (1 - \lambda) y \in \mathcal{D}.
$$

A function $f : \mathcal{D} \to \mathbb{R}$ is convex if $\mathcal{D}$ is convex and for every $x, y \in \mathcal{D}$, $0 \le \lambda \le 1$,

$$
f(\lambda x + (1 - \lambda) y) \le \lambda f(x) + (1 - \lambda) f(y)
$$

The most desirable property of convex function is that if $\nabla f(x^*) = 0$, then $x^*$ is the only global/local minima of $f$.

There are many important examples of convex function, which is why we study convex optimization:
- Most classical machine learning models (e.g. linear regression, logistic regression, SVM, kernel methods)
- Most loss functions (e.g. mean squared loss, cross-entropy loss)
- Unfortunately deep learning models (e.g. neural networks, transformers) are not convex, but somehow many convex optimization algorithms still work

## (Stochastic) Gradient Descent Primer

The simplest (gradient-based) convex optimization algorithm is the gradient descent: at every timestep $t$, update

$$
x_{t+1} = x_t - \eta g_t.
$$

where in **gradient descent**, $g_t = \nabla f(x_t)$ and in **stochastic gradient descent**, $g_t$ is a random vector, such that $\mathbb{E}[g_t] = \nabla f(x_t)$ (unbiased), and $\mathbb{E}[\|g_t\|^2] \le G$ for some constant $G$ (bounded variance).

If the constraint set $\mathcal{D}$ is a closed and bounded convex set, we can do **projected gradient descent**, where we project $x_{t+1}$ back to $\mathcal{D}$ if it is out of bound:

$$
x_{t+1} = P_{\mathcal{D}}(x_t - \eta g_t).
$$

It is not hard to show that gradient descent converges  with the assumption that $f$ is convex and $\sup_{x \in \mathcal{D}}\|\nabla^2 f(x)\| \le L$ (a.k.a. $L$-smooth). If $f$ is convex, then we have a inequality called the **lower linear bound**:

$$
f(y) \ge f(x) + \langle \nabla f(x), y - x \rangle.
$$

The formula is actually extremely geometrically intuitive: it basically says the tangent line at $x$ (RHS) is always below the convex function (LHS).

Plugging into $y = x^*$, $x = x_t$, we have

$$
\begin{aligned}
f(x^*) &\ge f(x_t) + \langle \nabla f(x_t), x^* - x_t \rangle\\
&= f(x_t) + \frac{1}{\eta}\langle x_t - x_{t+1}, x^* - x_t \rangle.
\end{aligned}
$$

We need another geometric inequality called the [law of cosines](https://en.wikipedia.org/wiki/Law_of_cosines). The plane geometry version was taught in high school (at least in China), we just need the vector version, where we substitute $x_t - x_{t+1}$, $x^* - x_t$, $x^* - x_{t+1}$ for the three sides to get

$$
\|x^* - x_{t+1}\|^2 = \|x_t - x_{t+1}\|^2 + \|x^* - x_t\|^2 - 2\langle x_t - x_{t+1}, x^* - x_t\rangle
$$

Then rearranging and substitute the inner product, we get

$$
\begin{aligned}
f(x_t)
&\le f(x^*) + \frac{1}{2\eta}\left(\|x^* - x_t\|^2 - \|x^* - x_{t+1}\|^2 + \|x_t - x_{t+1}\|^2\right)\\
&\le f(x^*) + \frac{1}{2\eta}\left(\|x^* - x_t\|^2 - \|x^* - x_{t+1}\|^2 + \eta^2 \|g_t\|^2\right).
\end{aligned}
$$

Then, summing up from $t=1,\dots,T$, we have

$$
\frac{1}{T}\sum_{t=1}^T f(x_t) \le f(x^*) + \frac{1}{2\eta}\left(\|x^* - x_0\|^2 + \eta^2 \sum_{t=1}^T \|g_t\|^2\right)
$$

We just need to bound $\|g_t\|^2$! For gradient descent, if $f$ is $L$-smooth, then by Taylor’s theorem, for some $\xi \in \mathcal{D}$ (in fact an interpolation of $y$ and $x$),

$$
\begin{aligned}
f(y) &= f(x) + \langle \nabla f(x), y - x \rangle + \langle \nabla^2 f(\xi) (y-x), y-x\rangle\\
&\le f(x) + \langle \nabla f(x), y - x \rangle + \frac{L}{2} \|y - x\|^2.
\end{aligned}
$$

Plugging into $y = x_{t+1}$ and $x = x_t$, we have

$$
\begin{aligned}
f(x_{t+1})
&\le f(x_t) + \langle \nabla f(x_t), x_{t+1} - x_t \rangle + \frac{L}{2} \|x_{t+1} - x_t\|^2\\
&\le f(x_t) - \eta \|\nabla f(x_t)\|^2 + \frac{L}{2}\eta^2 \|\nabla f(x_t)\|^2.
\end{aligned}
$$

Choosing $\eta = \frac{1}{L}$, we have

$$
\|\nabla f(x_t)\|^2 \le \frac{2}{\eta}(f(x_t) - f(x_{t+1}))
$$

so the sum of the gradient is at most $O(1/\eta)$. Using the earlier telescoping sum, we see the average loss is at most $O(1/T)$.

For SGD, we just bound $\|g_t\|^2$ by the variance, so sum is $O(T)$. We can pick $\eta = O(1/\sqrt{T})$ in this case, so the average loss is at most $O(1/\sqrt{T})$.

---

## Online Convex Optimization

If you have some software engineering background, the word "online" here means the same when we say "online update", that we want to do something in real time.

In online convex optimization, instead of a single objective function, a sequence of functions $f_1, f_2, \dots$ is given. We need to pick a point $x_t$ before knowing anything about $f_t$. This might sound hard, but the objective is also easier: to minimize the regret compared to the minima $x^*$ of the sum

$$
R_T := \sum_{t=1}^T f_t(x_t) - \min_{x^* \in \mathcal{D}} \sum_{t=1}^T f_t(x^*).
$$

The goal is to make $\lim_{T \to \infty} \frac{R_T}{T} \to 0$, so we have vanishing average regret.

In fact, a lot of problems can be seen as online optimization. Many textbooks will say multi-armed bandits and its evolved version: reinforcement learning. But actually it's application is much wider. For example:

- **(Mini-batch) stochastic gradient descent**: At every epoch, sample a batch from the dataset, and only focus on optimizing the loss on the batch (ignore other data). Then we have a changing objective, and the regret will converge to the actual loss.
- **Non-convex optimization**: In empirical risk minimization, to minimize $f(w) = \sum_{i=1}^N \ell(h(w, x_i), y_i)$, with the model $h$ non-convex and loss $\ell$ convex, we can equivalently solve the following online convex optimization problem

  $$
  f_t(w) = \frac{1}{N} \sum_{i=1}^N \ell(h(w_t, x_i) + \langle \nabla_w h(w_t, x_i), w - w_t \rangle, y_i).
  $$

This problem seems hard, since we don’t know anything about functions in the future.
Typically, there is no guarantee that the functions are similar.
Surprisingly, gradient descent can still minimize the regret, even if we use a different function for every update step!
This is because the baseline is the minimizer of the sum $\min_{x^* \in \mathcal{D}}\sum_{t=1}^T f_t(x^*)$, and not the minimizers of each function.

The proof is pretty much the same as the stochastic gradient case. We need to assume $f_t$ to be Lipschitz, that is for every $x,y \in \mathcal{D}$,

$$
|f(x) - f(y)| \le L\|x-y\|
$$

which bounds the gradient $\|\nabla f(x)\| \le L$. The regret is $O(\sqrt{T})$, so the average regret is vanishing (Zinkevich, 2003).

---

## Zeroth-Order Online Convex Optimization

Finally we jump to the most interesting part of this note. An algorithm being **zeroth-order** means, at every timestep $t$, instead of $\nabla f_t(x_t)$, it can only observe $f_t(x_t)$.

This is natural in scenarios where gradient is hard to obtain, or the objective function is not differentiable.
For example, a company wants to decide how much money to spend on advertising their products in $d$ channels.
The objective function is the profit, which is changing rapidly over time, and in general there is no guarantee about how it will change.
The company definitely cannot know anything about the future, and they need to choose the allocations before observing the profit.
The gradient is hard to obtain in this case — they don’t know what the objective function is. They only know their profits.

The fact that this problem is hard is largely related to the online nature. In offline settings, we can solve this if we approximate $\nabla f(x)$ by

$$
\langle \nabla f(x), u \rangle = \lim_{\delta \to 0} \frac{f(x + \delta u) - f(x)}{\delta}.
$$

We can pick a sufficiently small $\delta$, so when $f$ is Lipschitz, this will be a good approximation of the partial derivatives.

In $\mathbb{R}^d$, we need to approximate $d$ times to estimate the gradient.
But in the online setting, we can only observe the value of $f_t$ at one point! Once we observe the value, the objective function changes to $f_{t+1}$, and we cannot get more information about $f_t$.

### Solution of Flaxman (2005)

What if we can sample a unit random vector?
The key idea is to use Stoke’s theorem to approximate the stochastic gradient.

$$
\nabla f(x) \approx \mathbb{E}_{u \sim \mathbb{S}}\left[\frac{d}{\delta} f(x + \delta u) u\right] = \mathbb{E}_{u \sim \mathbb{S}}\left[\frac{d}{\delta} (f(x + \delta u) - f(x)) u\right]
$$

We only need the function value at one point $f(x + \delta v)$ to approximate the stochastic gradient!

Formally, let $\mathbb{S}$ be the unit sphere in $\mathbb{R}^d$, and $\mathbb{B}$ be the unit ball in $\mathbb{R}^d$.
By Stoke’s theorem

$$
\nabla \int_{\delta \mathbb{B}} f(x + v)\,dv = \int_{\delta \mathbb{S}} f(x + u) \frac{u}{\|u\|}\,du.
$$

Then, since $\mathrm{vol}(\mathbb{B}) = d\,\mathrm{vol}(\mathbb{S})$, we have

$$
\mathbb{E}_{u \sim \mathbb{S}}\left[\frac{d}{\delta} f(x + \delta u) u\right] =
\nabla \widehat{f}(x)
$$

where

$$
\widehat{f}(x) = \mathbb{E}_{v \sim \mathbb{B}}[f(x + \delta v)].
$$

If we sample $v \sim \mathbb{S}$, then $\frac{d}{\delta} f(x + \delta v)v$ is a stochastic gradient of $\widehat{f}$ at $x$, which we can use to do stochastic gradient descent.
$\widehat{f}$ is an "average" of $f$ in a neighborhood of radius $\delta$, so when $\delta$ is small and $f$ is Lipschitz, the difference between $f$ and $\widehat{f}$ is small.
This gives us the algorithm: at every timestep, sample $u_t \sim \mathbb{S}$, and update using

$$
x_{t+1} = P_{\mathcal{D}}\left(x_t - \eta \frac{\delta}{d} f_t(x_t + \delta u_t)u_t\right).
$$

We can bound $\|g_t\|^2 \le \frac{d}{\delta} \max_{x \in \mathcal{D}} |f_t(x)|$.
The standard online gradient descent proof gives us a bound on the regret of $\widehat{f}_t$ as $O(\frac{\sqrt{T}}{\delta})$.
However, this is a bound on the regret of $\widehat{f}_t$ instead of $f_t$. We know that if each $f_t$ is Lipschitz, then there is an additional error of

$$
\sum_{t=1}^T f_t(x_t) - \sum_{t=1}^T \widehat{f}_t(x_t) \le O(\delta T)
$$

Choosing $\delta = O(T^{-1/4})$ gives us a regret of $O(T^{3/4})$.

### Two-Point Estimates (Agarwal et al., 2010)
There are various extensions of this “bandit” setting in online convex optimization.
Better algorithms exist if additional assumptions are made.

When we have two points as feedback, similarly we can estimate the gradient by

$$
\nabla f(x) \approx \mathbb{E}_{u \sim \mathbb{S}} \left[\frac{d}{2\delta}(f(x + \delta u) - f(x - \delta u)) u\right].
$$

When $f$ is Lipschitz, $|f(x + \delta u) - f(x - \delta u)| \le 2\delta$, so we removed the $\delta^{-1}$ factor in the bound of $\|g_t\|$.
Then, we can choose $\delta = O(\frac{1}{\sqrt{T}})$, so regret is bounded by $O(\sqrt{T})$, which asymptotically is as good as when we have the gradient.

### Smooth Objective Functions (Saha & Tewari, 2011)

What if we can sample from other than a sphere?
For a positive semidefinite matrix $A$, we can also approximate by

$$
\nabla \widehat{f}(x) = \frac{d}{\delta}f(x + \delta A u)A^{-1}u
$$

where $u \sim \mathbb{S}$ and

$$
\widehat{f}(x) = \mathbb{E}_{u \sim \mathbb{B}}[f(x + \delta Au)].
$$

Saha & Tewari (2011) improve the regret to $O(T^{2/3})$ for smooth functions by finding a sequence of $A_t$ from a self-concordant barrier function using an interior point method.

### Application in Concave Games (Bravo et al., 2018)
Finally, an interesting application of this zeroth-order online convex optimization problem and algorithm is in concave games.
Suppose we have a repeated game, where each players have a concave utility function $u_i$.
The players can only optimize their action $x_i$, but they cannot control the action of other players $x_{-i}$.
We can define $f_t(x_{t,i}) = u_i(x_{t,i}, x_{t,-i})$, then this becomes an online optimization problem.
The individual players can use the algorithm by Flaxman (2005) if they only receive their utility as feedback.
Bravo et al. (2018) shows that the game converges to a Nash equilibrium if the players use this strategy.
