package com.example.potiongo.ui.screens

sealed class HomeUiState{
    data object DriverView : HomeUiState()
    data object CustomerView: HomeUiState()
    data object IsSignOut : HomeUiState()
    data class Error(val error : String) : HomeUiState()
    data object ErrorProduct : HomeUiState()
}