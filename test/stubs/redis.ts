let map = []
let configTimeout

const quit = () => {
}

const set = (key, value, test, timeout) => {
  if (!value) {
    throw new Error('Test error')
  }

  configTimeout = timeout * 1000
  map.push({ key, value, time: new Date().getTime() })
}

const delAsync = async (key) => {
  map = map.filter(item => key !== item.key)

  return true
}

const getAsync = async (key) => {
  const r = map.filter(item => key === item.key)

  if (r.length === 0) {
      return
    }

  if (new Date().getTime() - r[0].time > configTimeout) {
    map = map.filter(item => key !== item.key)
    return ''
  }

  return r.length > 0 ? r[0].value : ''
}

const setAsync = async (key, value, test, timeout) => {
  set(key, value, test, timeout)
  return true
}

export default { quit, delAsync, getAsync, set, setAsync }

const restore = () => { map = [] }
export { restore }
