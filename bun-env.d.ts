declare module '*.module.css' {
    /**
     * A record of class names to their corresponding CSS module classes
     */
    const classes: { readonly [key: string]: string };
    export = classes;
}
