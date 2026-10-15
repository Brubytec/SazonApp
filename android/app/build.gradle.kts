plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.sazonysabor.sazonapp"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    defaultConfig {
        applicationId = "com.sazonysabor.sazonapp"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    // URL base de la API (backend Node/Express). Se puede sobrescribir en
    // gradle.properties o en ~/.gradle/gradle.properties sin tocar el código.
    //  - debug: 10.0.2.2 es el "localhost" del PC visto desde el emulador.
    //  - release: servidor desplegado en el VPS.
    val apiDebug = providers.gradleProperty("SAZON_API_URL_DEBUG")
        .getOrElse("http://10.0.2.2:3001/api/")
    val apiRelease = providers.gradleProperty("SAZON_API_URL_RELEASE")
        .getOrElse("http://sazonysabor.runatec.org/api/")

    buildTypes {
        debug {
            buildConfigField("String", "API_BASE_URL", "\"$apiDebug\"")
        }
        release {
            buildConfigField("String", "API_BASE_URL", "\"$apiRelease\"")
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.activity)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.lifecycle.viewmodel)
    implementation(libs.androidx.lifecycle.livedata)
    implementation(libs.androidx.recyclerview)
    implementation(libs.androidx.lifecycle.viewmodel.ktx)
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp.logging)
    implementation(libs.kotlinx.coroutines.android)
    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.okhttp.mockwebserver)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
}