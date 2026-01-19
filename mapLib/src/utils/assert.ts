export class Assert {
//@ts-ignore
  static assert(p: boolean, s: string = null) {
    if (!p) {
      if (s != null) {
        //console.log(s)
        throw new Error(s)
      }
      throw new Error('condition does not hold')
    }
  }
}
